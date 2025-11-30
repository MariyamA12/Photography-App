import React, { useEffect, useState } from "react";
import { fetchPayments } from "../../services/admin/paymentService";

export default function PurchaseHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayments() {
      try {
        const data = await fetchPayments();
        setPayments(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  if (loading) return <p>Loading purchase history...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
      {payments.length === 0 ? (
        <p>No purchases found.</p>
      ) : (
        <table className="min-w-full border border-gray-300 bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border">Order ID</th>
              <th className="px-4 py-2 border">Items</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Amount</th>
              <th className="px-4 py-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{p.order_id}</td>
                <td className="px-4 py-2 border">
                  <div className="space-y-3">
                    {Array.isArray(p.items) && p.items.length > 0
                      ? 
                      Object.values(
                          p.items.reduce((acc, item) => {
                            if (!acc[item.item_id]) {
                              acc[item.item_id] = { ...item }; // copy first occurrence
                            } else {                              // added before? then merge it
                              acc[item.item_id].quantity += item.quantity;
                              acc[item.item_id].total += item.total; //adds the total
                            }
                            return acc;
                          }, {})
                        ).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition"
                          >
                             <img
                            src={item.item_image}
                            alt={item.item_name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                           <div className="flex flex-col text-sm">
                            <span className="font-semibold text-gray-800">
                              {item.item_name}
                            </span>
                            <span className="text-gray-500">
                              Qty: {item.quantity} | £{item.price} each
                            </span>
                            <span className="text-gray-700 font-medium">
                              Total: £{item.total}
                            </span>
                          </div>
                        </div>
                        ))
                      : <p className="text-gray-500 text-sm italic">No items found</p> //debug
                    }
                  </div>
                </td>
                <td className="px-4 py-2 border">{p.user_email}</td>
                <td className="px-4 py-2 border font-semibold">  £{p.total_amount ? Number(p.total_amount).toFixed(2) : "0.00"}</td>
                <td className="px-4 py-2 border">
                {p.created_at
                  ? new Date(p.created_at).toLocaleString("en-GB", { timeZone: "Europe/London", hour12: false })
                  : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
