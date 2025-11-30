// Parent purchase handling
const Stripe = require("stripe");
const dotenv =  require ("dotenv");
const db = require("../../config/db"); 

dotenv.config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    let { amount, userId, userName, userEmail, purchasedItems } = req.body;
    amount = parseInt(amount);

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!userId || !userName || !userEmail) {
      return res.status(400).json({ error: "User info required" });
    }

    const userResult = await db.query(
      `SELECT id, name, email FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    // Generate order ID
    const now = new Date();
    const orderId = `ORD_${now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;

    const customer = await stripe.customers.create({
      email: userEmail,
      name: userName
    });

    console.log("Creating Stripe customer and payment intent with:");
    console.log({ amount, userId, userName, userEmail, orderId, purchasedItems });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "gbp",
      customer: customer.id,
      automatic_payment_methods:{
        enabled:true,
      },
      metadata: 
      {
        userId: String(userId), 
        userName, 
        userEmail, 
        orderId, 
        purchasedItems: JSON.stringify(purchasedItems.map(item => ({
               id: item.id,
               image: item.image,
               itemName: item.name,
               quantity: item.quantity || 1,
               price: item.price || 0
             })) || [])
      }
    });

  
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" }
    );

    res.status(200).json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      orderId
    });
  } catch (error) {
    console.error("Stripe error:",  error.raw ? error.raw.message : error.message, error);
    res.status(500).json({ error: "Failed to create payment sheet" });
  }
};

module.exports = { createCheckoutSession };
