const BASE = "/api/admin/payments";

/**
 * Fetch all payment transactions (for admin panel or parent purchase history)
 */
export async function fetchPayments() {
  const res = await fetch(`${BASE}`, {
    credentials: "include", // keeps cookies/session
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Failed to fetch payments");
  }

  return res.json(); // returns array of payments
}