const bcrypt = require("bcryptjs");

const { User } = require("../user/user.model");
const ApiError = require("../../utils/ApiError");
const authRepository = require("./auth.repository");
const tokenService = require("./auth.tokenService");
const otpService = require("../../services/otp.service");
const { getMailTransporter } = require("../../config/mail");

const OTP_PURPOSE = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  LOGIN: "LOGIN",
  PASSWORD_RESET: "PASSWORD_RESET",
};

const ALLOWED_ROLES = ["customer", "agent", "admin"];

async function sendOtpEmail(email, otp, purpose) {
  const transporter = getMailTransporter();

  const subjects = {
    EMAIL_VERIFICATION: "Verify your email",
    LOGIN: "Your login verification code",
    PASSWORD_RESET: "Reset your password",
  };

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: subjects[purpose] || "Your verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
        <h2>Ticketing System</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:6px">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  });
}

async function issueOtp(user, purpose, destination) {
  const otp = await otpService.generateAndStore({
    userId: user._id,
    purpose,
    destination,
  });

  await sendOtpEmail(destination, otp, purpose);

  return {
    message: "Verification code sent successfully",
  };
}

// REGISTER
async function register(data) {
  const email = data.email.toLowerCase().trim();

  const existingUser = await User.findOne({
    $or: [{ email }, { phone: data.phone }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email or phone already exists",
    );
  }

  // Use the submitted role, or default to customer.
  const role = data.role?.trim().toLowerCase() || "customer";

  if (!ALLOWED_ROLES.includes(role)) {
    throw new ApiError(400, "Role must be customer, agent, or admin");
  }

  // Customers must verify their email.
  // Admins and agents skip email verification during registration.
  const requiresEmailVerification = role === "customer";

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    fullName: data.fullName.trim(),
    email,
    phone: data.phone,
    password: passwordHash,
    role,
    isEmailVerified: !requiresEmailVerification,
    isPhoneVerified: false,
    isActive: true,
  });

  if (requiresEmailVerification) {
    await issueOtp(user, OTP_PURPOSE.EMAIL_VERIFICATION, user.email);
  }

  return {
    userId: user._id,
    email: user.email,
    role: user.role,
    requiresEmailVerification,
    message: requiresEmailVerification
      ? "Account created. Verify your email to continue."
      : "Account created successfully. You can log in now.",
  };
}

// VERIFY EMAIL / OTHER OTP PURPOSES
async function verifyOtp({ email, otp, purpose }) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new ApiError(400, "Invalid verification request");
  }

  const selectedPurpose = purpose || OTP_PURPOSE.EMAIL_VERIFICATION;

  if (
    selectedPurpose === OTP_PURPOSE.EMAIL_VERIFICATION &&
    user.isEmailVerified
  ) {
    return {
      message: "Email is already verified",
    };
  }

  await otpService.verify({
    userId: user._id,
    purpose: selectedPurpose,
    destination: normalizedEmail,
    otp,
  });

  if (selectedPurpose === OTP_PURPOSE.EMAIL_VERIFICATION) {
    user.isEmailVerified = true;
    await user.save();
  }

  return {
    message: "OTP verified successfully",
  };
}

// LOGIN WITH EMAIL AND PASSWORD
async function loginWithPassword(data, request) {
  const email = data.email.toLowerCase().trim();

  const user = await User.findOne({ email }).select("+password");

  if (!user || !user.password) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(data.password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been disabled");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const tokens = await tokenService.issueTokens(user, request);

  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new ApiError(500, "Failed to generate authentication tokens");
  }

  return {
    user: user.toSafeObject(),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// REQUEST LOGIN OTP
async function requestLoginOtp(data) {
  const query = data.email
    ? { email: data.email.toLowerCase().trim() }
    : { phone: data.phone };

  const user = await User.findOne(query);

  // Avoid revealing whether an account exists.
  if (!user || !user.isActive || !user.isEmailVerified) {
    return {
      message: "If the account exists, a login code will be sent",
    };
  }

  if (!data.email) {
    throw new ApiError(
      501,
      "Phone OTP delivery is not enabled. Configure Twilio before using phone login.",
    );
  }

  await issueOtp(user, OTP_PURPOSE.LOGIN, user.email);

  return {
    message: "If the account exists, a login code will be sent",
  };
}

// VERIFY LOGIN OTP
async function verifyLoginOtp(data, request) {
  const query = data.email
    ? { email: data.email.toLowerCase().trim() }
    : { phone: data.phone };

  const user = await User.findOne(query);

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid or expired login code");
  }

  if (!data.email) {
    throw new ApiError(501, "Phone OTP verification is not enabled yet");
  }

  await otpService.verify({
    userId: user._id,
    purpose: OTP_PURPOSE.LOGIN,
    destination: user.email,
    otp: data.otp,
  });

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email first");
  }

  const tokens = await tokenService.issueTokens(user, request);

  return {
    user: user.toSafeObject(),
    ...tokens,
  };
}

// REFRESH ACCESS TOKEN
async function refreshToken(refreshToken, request) {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const tokens = await tokenService.rotateRefreshToken(refreshToken, request);

  return tokens;
}

// LOGOUT
async function logout(refreshToken) {
  await tokenService.revokeRefreshToken(refreshToken);

  return {
    message: "Logged out successfully",
  };
}

// FORGOT PASSWORD
async function forgotPassword({ email }) {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  // Use a generic response to reduce account enumeration.
  if (!user || !user.isActive) {
    return {
      message: "If the account exists, a reset code will be sent",
    };
  }

  await issueOtp(user, OTP_PURPOSE.PASSWORD_RESET, user.email);

  return {
    message: "If the account exists, a reset code will be sent",
  };
}

// RESET PASSWORD
async function resetPassword({ email, otp, newPassword }) {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user || !user.isActive) {
    throw new ApiError(400, "Invalid or expired reset code");
  }

  await otpService.verify({
    userId: user._id,
    purpose: OTP_PURPOSE.PASSWORD_RESET,
    destination: user.email,
    otp,
  });

  user.password = await bcrypt.hash(newPassword, 12);

  await user.save();

  await authRepository.revokeAllUserSessions(user._id);

  return {
    message: "Password reset successfully. Please log in again.",
  };
}

module.exports = {
  register,
  verifyOtp,
  loginWithPassword,
  requestLoginOtp,
  verifyLoginOtp,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
