const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const userService = require("./user.service");

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getMyProfile(req.user.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile fetched successfully", profile));
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateMyProfile(
    req.user.id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", profile));
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(100, Math.max(1, Number(req.query.limit) || 20)),
    role: req.query.role,
    search: req.query.search,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      "Users fetched successfully",
      result.users,
      result.pagination,
    ),
  );
});

const getUserById = asyncHandler(async (req, res) => {
  const data = await userService.getUserById(req.params.userId);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "User fetched successfully"));
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const data = await userService.updateUserStatus(
    req.params.userId,
    req.body.isActive,
    req.user.id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, data, "User status updated successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const data = await userService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, data, data.message));
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  listUsers,
  getUserById,
  updateUserStatus,
  changePassword,
};