const db = require('../../config/db');

// Fetch past orders for a specific user
const getPastOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await db.query(
        `SELECT 
        order_id, 
        MIN(created_at) AS date, 
        MIN(amount) AS total,
        json_agg(json_build_object(
          'item_id', item_id,
          'item_name', item_name,
          'item_image', item_image,
          'quantity', quantity,
          'price', total_item_amount
        )) AS items
     FROM payment_transactions
     WHERE user_id = $1
     GROUP BY order_id
     ORDER BY date DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching past orders:', err);
    res.status(500).json({ error: 'Server error fetching past orders' });
  }
};

module.exports = { getPastOrders };