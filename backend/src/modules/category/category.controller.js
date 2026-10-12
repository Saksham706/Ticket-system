const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const categoryService = require("./category.service");

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Categories fetched successfully", categories));
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(
    req.body,
    req.user,
  );

  return res
    .status(201)
    .json(new ApiResponse(201, "Category created successfully", category));
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.categoryId,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Category updated successfully", category));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(
    req.params.categoryId,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Category deleted successfully", result));
});

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};