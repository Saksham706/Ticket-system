const {
  extractTicketNumber,
} = require("./emailThreading.service");

describe("Email ticket threading", () => {
  test("extracts a ticket number from a subject", () => {
    expect(
      extractTicketNumber(
        "Re: TKT-2026-000123 - Login issue"
      )
    ).toBe("TKT-2026-000123");
  });

  test("returns null for an unrecognized subject", () => {
    expect(
      extractTicketNumber("General question")
    ).toBeNull();
  });
});