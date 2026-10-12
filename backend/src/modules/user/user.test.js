const {
  updateProfileSchema,
} = require("./user.validation");

describe("User profile validation", () => {
  test("accepts a valid name", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Example User",
    });

    expect(result.success).toBe(true);
  });

  test("rejects an empty update", () => {
    const result = updateProfileSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});