export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "francecen@gmail.com";

export async function sendOrderEmail(order: {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    country: string;
  };
  total: number;
  currency: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  createdAt: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[Order email] Resend API key not configured. Skipping live email send.", {
      to: ADMIN_EMAIL,
      orderId: order.id,
    });
    return { ok: true, skipped: true };
  }

  const productList = order.items
    .map(
      (item) => `
        <li>
          <strong>${item.title}</strong> × ${item.quantity} — ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: order.currency,
          }).format(item.price * item.quantity)}
        </li>`,
    )
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Tinnah Collections <noreply@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `New order received: ${order.id}`,
      html: `
        <h2>New order received</h2>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Customer:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
        <p><strong>Email:</strong> ${order.customer.email}</p>
        <p><strong>Address:</strong> ${order.customer.address}, ${order.customer.city}, ${order.customer.country}</p>
        <p><strong>Placed:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <ul>${productList}</ul>
        <p><strong>Total:</strong> ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: order.currency,
        }).format(order.total)}</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((body as { error?: string }).error ?? "Email could not be sent.");
  }

  return { ok: true, skipped: false };
}
