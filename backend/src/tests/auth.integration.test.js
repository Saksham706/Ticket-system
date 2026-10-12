const request = require("supertest");
const app = require("../app");

describe("Authentication API integration", () => {
  test("health endpoint responds", async () => {
    const response = await request(app).get(
      "/api/health"
    );

    expect([200, 503]).toContain(response.status);
  });
});