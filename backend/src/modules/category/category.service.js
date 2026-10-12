const ApiError = require("../../utils/ApiError");
const repository = require("./category.repository");
const { recordAudit } = require("../../services/audit.service");

async function listCategories(user) {
  return repository.listCategories({
    includeInactive: user?.role === "admin",
  });
}

async function createCategory(data, user) {
  const name = data.name.trim();

  const existing = await repository.listCategories({
    includeInactive: true,
  });

  if (
    existing.some(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    throw new ApiError(409, "Category name already exists");
  }

  const category = await repository.createCategory({
    name,
    description: data.description || "",
    createdBy: user.id,
  });

  await recordAudit({
    actor: user.id,
    action: "CATEGORY_CREATED",
    resourceType: "Category",
    resourceId: category._id,
    metadata: {
      name: category.name,
    },
  });

  return category;
}

async function updateCategory(id, data, user) {
  const updates = {};

  if (data.name !== undefined) {
    updates.name = data.name.trim();
  }

  if (data.description !== undefined) {
    updates.description = data.description;
  }

  if (data.isActive !== undefined) {
    updates.isActive = data.isActive;
  }

  const category = await repository.updateCategory(id, updates);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  await recordAudit({
    actor: user.id,
    action: "CATEGORY_UPDATED",
    resourceType: "Category",
    resourceId: category._id,
    metadata: {
      updatedFields: Object.keys(updates),
      name: category.name,
      isActive: category.isActive,
    },
  });

  return category;
}

async function deleteCategory(id, user) {
  const category = await repository.deleteCategory(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  await recordAudit({
    actor: user.id,
    action: "CATEGORY_DELETED",
    resourceType: "Category",
    resourceId: category._id,
    metadata: {
      name: category.name,
    },
  });

  return {
    message: "Category deleted permanently",
  };
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};