"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type Order = {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    country: string;
  };
  items: Array<{
    id: string;
    title: string;
    category: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
  status: string;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = (await response.json()) as Order[];
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-3 py-5 text-[var(--text)] sm:px-4 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 sm:rounded-[2rem] sm:p-6 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25rem] text-[var(--accent)] sm:text-xs">Admin</p>
            <h1 className="mt-2 text-2xl text-white sm:mt-3 sm:text-3xl">Orders dashboard</h1>
          </div>
          <a
            href="/admin/dashboard"
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/80 transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-4 sm:text-sm"
          >
            Back to products
          </a>
        </header>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-[var(--surface)] p-8 text-center text-white/70">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-[var(--surface)] p-6 text-center text-sm text-white/70 sm:rounded-[2rem] sm:p-8">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {orders.map((order) => (
              <article key={order.id} className="rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 sm:rounded-[2rem] sm:p-6">
                <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2rem] text-[var(--accent)] sm:text-xs">Order {order.id}</p>
                    <h2 className="mt-2 text-xl text-white sm:text-2xl">{order.customer.firstName} {order.customer.lastName}</h2>
                  </div>
                  <div className="text-xs text-white/70 sm:text-sm">
                    <p>{new Date(order.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-[var(--accent)]">{order.status}</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3 sm:space-y-4">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.id}`} className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-[#1d232b] p-3 sm:rounded-[1.25rem]">
                        <div>
                          <p className="text-sm text-white sm:text-base">{item.title}</p>
                          <p className="text-[10px] uppercase tracking-[0.2rem] text-white/60 sm:text-xs">{item.category}</p>
                        </div>
                        <div className="text-right text-xs text-white/70 sm:text-sm">
                          <p>{item.quantity}x</p>
                          <p className="mt-1 text-[var(--accent)]">{formatMoney(item.price * item.quantity, order.currency)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.25rem] border border-white/10 bg-[#1d232b] p-4 sm:rounded-[1.5rem] sm:p-5">
                    <p className="text-xs uppercase tracking-[0.2rem] text-white/60 sm:text-sm">Customer</p>
                    <div className="mt-3 space-y-2 text-xs text-white/80 sm:text-sm">
                      <p>{order.customer.email}</p>
                      <p>{order.customer.address}</p>
                      <p>{order.customer.city}, {order.customer.country}</p>
                    </div>

                    <div className="mt-6 space-y-2 border-t border-white/10 pt-4 text-xs text-white/70 sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span>{formatMoney(order.subtotal, order.currency)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Shipping</span>
                        <span>{formatMoney(order.shipping, order.currency)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base text-white">
                        <span>Total</span>
                        <span>{formatMoney(order.total, order.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
