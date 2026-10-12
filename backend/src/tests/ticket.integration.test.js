const {
  createTicketSchema,
} = require("../modules/ticket/ticket.validation");

describe("Ticket API contract", () => {
  test("requires valid title, description, and category", () => {
    const result = createTicketSchema.safeParse({
      title: "",
      description: "",
      category: "bad",
    });

    expect(result.success).toBe(false);
  });
});