const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Admin backend Stripe key
const db = require("../../config/db"); //database connection

const stripeWebhookHandler = async (req, res) => {
    console.log("Webhook received!");
    console.log(req.body.toString()); // raw body

    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event type
    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const { userId, userName, userEmail, orderId, purchasedItems } = paymentIntent.metadata;
        const items = JSON.parse(purchasedItems || "[]");
        // Save to DB
        try {
            for (const item of items) {
                 await db.query(
                       `INSERT INTO payment_transactions
                        (order_id, amount, item_id, item_name, item_image, user_id, user_email, quantity, item_price, total_item_amount, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
                       [
                         orderId,
                        (paymentIntent.amount_received / 100).toFixed(2),
                         item.id,
                         item.itemName,
                         item.image,
                         userId,
                         userEmail,
                         item.quantity,
                         item.price,
                         item.price * item.quantity || 0
                       ]
                    );

            }
            await db.query(
                `INSERT INTO orders_summary
                (order_id, user_id, user_name, user_email, transaction_id, total_amount, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [
                orderId,
                userId,
                userName,
                userEmail,
                paymentIntent.id,
                (paymentIntent.amount_received / 100).toFixed(2) // Stripe sends minor units (e.g., 1499 = £14.99)
                ]
            );
           
            console.log("Order + items saved:", orderId);
        } catch (err) {
        console.error("DB error:", err);
        }
    }

    // Respond with 200
    res.json({ received: true });

};

module.exports = { stripeWebhookHandler };