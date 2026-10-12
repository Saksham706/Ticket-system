const { User } = require("./user.model");

const findById = (id) => User.findById(id);

const findByIdWithPassword = (id) => User.findById(id).select("+password");

const findByEmail = (email) =>
  User.findOne({ email: email.toLowerCase().trim() });

const createUser = (data) => User.create(data);

const listUsers = async ({ page = 1, limit = 20, role, search }) => {
  const filter = {};

  if (role) filter.role = role;

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  findById,
  findByIdWithPassword,
  findByEmail,
  createUser,
  listUsers,
};
