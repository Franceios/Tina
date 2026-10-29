"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LastOrder = {
  id: string;
  total: number;
  currency: string;
};

export default function CheckoutConfirmationPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tinnah-last-order");
    if (saved) {
      try {
        setOrder(JSON.parse(saved) as LastOrder);
      } catch {
        setOrder(null);
      }
    }
  }, []);

  const formatMoney = (value: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-12 text-[var(--text)] md:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[var(--surface)] p-8 text-center md:p-12">
        <p className="text-xs uppercase tracking-[0.4rem] text-[var(--accent)]">Order received</p>
        <h1 className="mt-4 text-4xl text-white">Thank you for your purchase</h1>
        <p className="mt-4 text-white/70">
          Your order has been placed successfully and the admin email has been notified.
        </p>

        {order ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-[#1d232b] p-5 text-left">
            <p className="text-sm uppercase tracking-[0.2rem] text-[var(--accent)]">Order summary</p>
            <p className="mt-3 text-2xl text-white">#{order.id}</p>
            <p className="mt-4 text-lg text-white/80">
              Total: <span className="text-[var(--accent)]">{formatMoney(order.total, order.currency)}</span>
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-white/15 p-5 text-white/70">
            We saved your order and you can review it in the admin dashboard.
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--bg)]"
          >
            Back to shop
          </Link>
          <a
            href="/admin/orders"
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/80 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            View admin orders
          </a>
        </div>
      </div>
    </main>
  );
}
