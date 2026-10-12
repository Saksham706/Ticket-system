const crypto = require("crypto");

const ApiError = require("../utils/ApiError");
const authRepository = require("../modules/auth/auth.repository");

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateOtp() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

async function generateAndStore({ userId, purpose, destination }) {
  await authRepository.invalidateOtpChallenges(userId, purpose);

  const otp = generateOtp();

  await authRepository.createOtpChallenge({
    user: userId,
    purpose,
    destination,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  return otp;
}

async function verify({ userId, purpose, destination, otp }) {
  const challenge = await authRepository.findLatestOtpChallenge(
    userId,
    purpose,
  );

  if (!challenge) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (challenge.destination !== destination) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    await authRepository.consumeOtpChallenge(challenge._id);

    throw new ApiError(
      429,
      "Too many incorrect OTP attempts. Request a new code.",
    );
  }

  const suppliedHash = hashOtp(otp);

  const matches = crypto.timingSafeEqual(
    Buffer.from(challenge.otpHash, "hex"),
    Buffer.from(suppliedHash, "hex"),
  );

  if (!matches) {
    challenge.attempts += 1;
    await challenge.save();

    throw new ApiError(400, "Invalid or expired OTP");
  }

  const consumed = await authRepository.consumeOtpChallenge(challenge._id);

  if (!consumed) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  return true;
}

module.exports = {
  generateAndStore,
  verify,
};
