const {
  extractTicketNumber,
} = require("../modules/email/emailThreading.service");

describe("Inbound email contract", () => {
  test("recognizes ticket identifiers in reply subjects", () => {
    expect(
      extractTicketNumber(
        "Re: TKT-2026-000001 - Help"
      )
    ).toBe("TKT-2026-000001");
  });

  test("returns null without a ticket identifier", () => {
    expect(
      extractTicketNumber("Hello support")
    ).toBeNull();
  });
});