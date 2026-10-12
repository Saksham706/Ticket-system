const { createMessageSchema } = require("./ticketMessage.validation");

describe("Ticket message validation", () => {
  test("accepts a valid public reply", () => {
    const result = createMessageSchema.safeParse({
      body: "I need help with my account.",
      type: "public",
    });

    expect(result.success).toBe(true);
  });

  test("rejects an empty reply", () => {
    const result = createMessageSchema.safeParse({
      body: "   ",
    });

    expect(result.success).toBe(false);
  });

  test("rejects an invalid message type", () => {
    const result = createMessageSchema.safeParse({
      body: "A reply",
      type: "secret",
    });

    expect(result.success).toBe(false);
  });
});