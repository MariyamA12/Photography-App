const { createCheckoutSession } = require("../../src/controllers/parent/purchaseController");

// Mock DB
jest.mock("../../src/config/db", () => ({
  query: jest.fn().mockResolvedValue({
    rows: [{ id: 1, name: "Test User", email: "test@example.com" }],
  }),
}));

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: "mock_customer_id" }),
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "mock_client_secret" }),
    },
    ephemeralKeys: {
      create: jest.fn().mockResolvedValue({ secret: "mock_ephemeral_key" }),
    },
  }));
});

describe("Payment Controller (Unit-like)", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        amount: 1000,
        userId: 1,
        userName: "Test User",
        userEmail: "test@example.com",
        purchasedItems: [{ id: 1, name: "Photo", price: 100 }],
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should return 400 if no amount is provided", async () => {
    req.body.amount = null;
    await createCheckoutSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid amount" });
  });

  test("should return 400 if user info is missing", async () => {
    req.body.userId = null;
    await createCheckoutSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User info required" });
  });

  test("should return 200 and mocked Stripe info if inputs are valid", async () => {
    await createCheckoutSession(req, res);

    expect(res.status).toHaveBeenCalledWith(200); // Must be called with 200
    expect(res.json).toHaveBeenCalledWith({
      paymentIntent: "mock_client_secret",
      ephemeralKey: "mock_ephemeral_key",
      customer: "mock_customer_id",
      orderId: expect.any(String), // orderId is generated dynamically
    });
  });
});
