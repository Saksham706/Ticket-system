const bcrypt = require("bcryptjs");

const { User } = require("./user.model");
const ApiError = require("../../utils/ApiError");
const userRepository = require("./user.repository");
const { recordAudit } = require("../../services/audit.service");

async function getMyProfile(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user.toSafeObject();
}

async function updateMyProfile(userId, data) {
  const allowedFields = ["fullName", "phone"];
  const updates = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  if (updates.fullName !== undefined) {
    updates.fullName = updates.fullName.trim();
  }

  if (updates.phone !== undefined) {
    const existing = await User.findOne({
      phone: updates.phone,
      _id: { $ne: userId },
    });

    if (existing) {
      throw new ApiError(409, "Phone number is already registered");
    }

    updates.isPhoneVerified = false;
  }

  if (Object.keys(updates).length === 0) {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    return existingUser.toSafeObject();
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await recordAudit({
    actor: userId,
    action: "USER_PROFILE_UPDATED",
    resourceType: "User",
    resourceId: user._id,
    metadata: {
      updatedFields: Object.keys(updates).filter(
        (field) => field !== "isPhoneVerified",
      ),
    },
  });

  return user.toSafeObject();
}

async function listUsers(query) {
  return userRepository.listUsers(query);
}

async function getUserById(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user.toSafeObject();
}

async function updateUserStatus(userId, isActive, actorId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  if (user.isActive === isActive) {
    return user.toSafeObject();
  }

  const previousStatus = user.isActive;

  user.isActive = isActive;
  await user.save();

  await recordAudit({
    actor: actorId,
    action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    resourceType: "User",
    resourceId: user._id,
    metadata: {
      previousStatus,
      newStatus: isActive,
    },
  });

  return user.toSafeObject();
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.findByIdWithPassword(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const matches = await bcrypt.compare(currentPassword, user.password);

  if (!matches) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  await recordAudit({
    actor: userId,
    action: "USER_PASSWORD_CHANGED",
    resourceType: "User",
    resourceId: user._id,
    metadata: {},
  });

  return {
    message: "Password changed successfully",
  };
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  listUsers,
  getUserById,
  updateUserStatus,
  changePassword,
};