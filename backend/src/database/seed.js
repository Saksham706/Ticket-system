require("dotenv").config();

const bcrypt = require("bcryptjs");
const { connectDatabase, disconnectDatabase } = require("../config/database");

const { User } = require("../modules/user/user.model");
const { Category } = require("../modules/category/category.model");

async function seed() {
  await connectDatabase();

  try {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (email && password) {
      const normalizedEmail = email.toLowerCase().trim();

      const existingAdmin = await User.findOne({
        email: normalizedEmail,
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
          fullName: process.env.SEED_ADMIN_NAME || "System Admin",
          email: normalizedEmail,
          phone: process.env.SEED_ADMIN_PHONE || "+919999999999",
          password: hashedPassword,
          role: "admin",
          isEmailVerified: true,
          isPhoneVerified: false,
          isActive: true,
        });

        console.log("Administrator account created.");
      } else {
        console.log("Administrator already exists.");
      }
    } else {
      console.log(
        "Admin seed skipped: configure SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.",
      );
    }

    const categories = ["Technical Support", "Billing", "Account", "General"];

    for (const name of categories) {
      await Category.updateOne(
        { name },
        {
          $setOnInsert: {
            name,
            description: `${name} support`,
            isActive: true,
          },
        },
        { upsert: true },
      );
    }

    console.log("Default categories seeded.");
  } finally {
    await disconnectDatabase();
  }
}

seed().catch((error) => {
  console.error("Database seeding failed:", error);
  process.exitCode = 1;
});
