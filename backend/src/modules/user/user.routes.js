const express = require("express");

const userController = require("./user.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const validateMiddleware = require("../../middleware/validateMiddleware");

const {
  updateProfileSchema,
  changePasswordSchema,
  updateUserStatusSchema,
} = require("./user.validation");

const router = express.Router();

router.use(authMiddleware);

router.get("/me", userController.getMyProfile);

router.patch(
  "/me",
  validateMiddleware(updateProfileSchema),
  userController.updateMyProfile,
);

router.patch(
  "/me/password",
  validateMiddleware(changePasswordSchema),
  userController.changePassword,
);

router.get("/", roleMiddleware("admin"), userController.listUsers);

router.get("/:userId", roleMiddleware("admin"), userController.getUserById);

router.patch(
  "/:userId/status",
  roleMiddleware("admin"),
  validateMiddleware(updateUserStatusSchema),
  userController.updateUserStatus,
);

module.exports = router;
