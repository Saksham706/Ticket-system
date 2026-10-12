const {
  createTicketSchema,
} = require("./ticket.validation");

describe("Ticket validation", () => {
  test("accepts valid ticket fields", () => {
    const result = createTicketSchema.safeParse({
      title: "Login issue",
      description: "Unable to log in to my account",
      category: "507f1f77bcf86cd799439011",
      priority: "high",
    });

    expect(result.success).toBe(true);
  });

  test("rejects an invalid priority", () => {
    const result = createTicketSchema.safeParse({
      title: "Login issue",
      description: "Unable to log in",
      category: "507f1f77bcf86cd799439011",
      priority: "critical",
    });

    expect(result.success).toBe(false);
  });
});