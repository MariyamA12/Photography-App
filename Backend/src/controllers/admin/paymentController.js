const db = require("../../config/db");

const savePayment = async (req, res) => {
  const { orderId, itemId, itemName, itemImage, quantity, itemPrice, userEmail, amount } = req.body;

    try {
        await db.query(
            `INSERT INTO payment_transactions
            (order_id, item_id, item_name, item_image, quantity, item_price, user_email, amount)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [orderId, itemId, itemName, itemImage, quantity, itemPrice, userEmail, amount]
        );
        res.status(200).json({ success: true, message: "Payment saved" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error saving payment" });
    }
};

// Get all payments for admin panel
// const getPayments = async (req, res) => {
//     try {
//         const result = await db.query(`SELECT * FROM payment_transactions ORDER BY id DESC`);
//         res.json(result.rows); // rows contains the array of results
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Error fetching payments" });
//     }
// };

const getPayments = async (req, res) => {
    try {
      const result = await db.query(`
        SELECT os.order_id, os.user_email, os.total_amount, os.created_at,
        json_agg(
          json_build_object(
            'item_id', pt.item_id,
            'item_name', pt.item_name,
            'item_image', pt.item_image,
            'quantity', pt.quantity,
            'price', pt.item_price,
            'total', pt.total_item_amount
          )
        ) as items
      FROM orders_summary os
      JOIN payment_transactions pt ON os.order_id = pt.order_id
      GROUP BY os.order_id,os.user_id, os.user_email, os.total_amount, os.created_at
      ORDER BY os.created_at DESC;

      `);
  
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching payments" });
    }
  };

module.exports = { savePayment, getPayments };