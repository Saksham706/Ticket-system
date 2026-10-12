const { Category } = require("./category.model");

const listCategories = ({ includeInactive = false } = {}) => {
  const filter = includeInactive ? {} : { isActive: true };

  return Category.find(filter).sort({ name: 1 });
};

const findById = (id) => Category.findById(id);

const createCategory = (data) => Category.create(data);

const updateCategory = (id, updates) =>
  Category.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  async function deleteCategory(id) {
  return Category.findByIdAndDelete(id);
}
module.exports = {
  listCategories,
  findById,
  createCategory,
  updateCategory,
  deleteCategory,
};