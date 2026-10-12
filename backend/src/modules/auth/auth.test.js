const {
  passwordLoginSchema,
  verifyLoginOtpSchema,
} = require("./auth.validation");

describe("Authentication validation", () => {
  test("accepts valid email and password login input", () => {
    const result = passwordLoginSchema.safeParse({
      email: "user@example.com",
      password: "example-password",
    });

    expect(result.success).toBe(true);
  });

  test("requires an email or phone for OTP login", () => {
    const result = verifyLoginOtpSchema.safeParse({
      otp: "123456",
    });

    expect(result.success).toBe(false);
  });
});
