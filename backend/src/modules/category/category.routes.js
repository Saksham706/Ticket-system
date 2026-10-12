const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const validateMiddleware = require("../../middleware/validateMiddleware");

const controller = require("./category.controller");

const {
  createCategorySchema,
  updateCategorySchema,
} = require("./category.validation");

const router = express.Router();

router.use(authMiddleware);

router.get("/", controller.listCategories);

router.post(
  "/",
  roleMiddleware("admin"),
  validateMiddleware(createCategorySchema),
  controller.createCategory,
);

router.patch(
  "/:categoryId",
  roleMiddleware("admin"),
  validateMiddleware(updateCategorySchema),
  controller.updateCategory,
);

router.delete(
  "/:categoryId",
  roleMiddleware("admin"),
  controller.deleteCategory,
);

module.exports = router;
