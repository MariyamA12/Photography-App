const request = require("supertest");
const app = require("../../src/app");

// --- Mock Stripe ---
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: { create: jest.fn().mockResolvedValue({ id: "mock_customer_id" }) },
    paymentIntents: { create: jest.fn().mockResolvedValue({ client_secret: "mock_client_secret" }) },
    ephemeralKeys: { create: jest.fn().mockResolvedValue({ secret: "mock_ephemeral_key" }) },
  }));
});

// --- Mock DB ---
jest.mock("../../src/config/db", () => ({
  query: jest.fn().mockResolvedValue({
    rows: [{ id: 1, name: "Test User", email: "test@example.com" }],
  }),
}));

describe("Payment Routes (Integration with Mock Stripe)", () => {
  test("POST /api/parent/create-checkout-session should return 400 if no amount", async () => {
    const res = await request(app)
      .post("/api/parent/create-checkout-session")
      .send({
        userId: 1,
        userName: "Test User",
        userEmail: "test@example.com",
        purchasedItems: [{ id: 1, name: "Photo", price: 100 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid amount");
  });

  test("POST /api/parent/create-checkout-session should return 400 if no user info", async () => {
    const res = await request(app)
      .post("/api/parent/create-checkout-session")
      .send({
        amount: 1000,
        userId: null,
        userName: null,
        userEmail: null,
        purchasedItems: [{ id: 1, name: "Photo", price: 100 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("User info required");
  });

  test("POST /api/parent/create-checkout-session should return 200 and mocked Stripe info if valid", async () => {
    const res = await request(app)
      .post("/api/parent/create-checkout-session")
      .send({
        amount: 1000,
        userId: 1,
        userName: "Test User",
        userEmail: "test@example.com",
        purchasedItems: [{ id: 1, name: "Photo", price: 100 }],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        paymentIntent: "mock_client_secret",
        ephemeralKey: "mock_ephemeral_key",
        customer: "mock_customer_id",
        orderId: expect.any(String),
      })
    );
  });
});
