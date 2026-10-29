"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  title: string;
  price: number;
  category: string;
  imageUrl: string;
  quantity: number;
};

const supportedCurrencies = ["USD", "EUR", "GBP", "AED", "SAR", "CAD", "AUD", "GHS"];

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    const storedCart = localStorage.getItem("tinnah-cart");
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart) as CartItem[]);
      } catch {
        setCartItems([]);
      }
    }

    const savedCurrency = localStorage.getItem("tinnah-currency") ?? "USD";
    setCurrencyCode(savedCurrency);
    void fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${supportedCurrencies.filter((item) => item !== "USD").join(",")}`,
      );
      const data = (await response.json()) as { rates?: Record<string, number> };
      if (data.rates) {
        setCurrencyRates({ USD: 1, ...data.rates });
      }
    } catch {
      setCurrencyRates({
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        AED: 3.67,
        SAR: 3.75,
        CAD: 1.36,
        AUD: 1.5,
        GHS: 15.3,
      });
    }
  };

  const formatMoney = (amount: number) => {
    const rate = currencyRates[currencyCode] ?? 1;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount * rate);
  };

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const shipping = cartItems.length > 0 ? 25 : 0;
  const total = subtotal + shipping;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const country = String(formData.get("country") ?? "").trim();

    const payload = {
      customer: {
        firstName,
        lastName,
        email,
        address,
        city,
        country,
      },
      items: cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      shipping,
      total,
      currency: currencyCode,
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = (await response.json().catch(() => ({ error: "Order could not be placed." }))) as {
        error?: string;
      };
      window.alert(err.error ?? "Order could not be placed.");
      return;
    }

    const result = (await response.json()) as { order: { id: string } };
    localStorage.setItem("tinnah-last-order", JSON.stringify(result.order));
    localStorage.removeItem("tinnah-cart");
    setCartItems([]);
    window.location.href = "/checkout/confirmation";
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 py-12 text-[var(--text)] md:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[var(--surface)] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.35rem] text-[var(--accent)]">Checkout</p>
          <h1 className="mt-4 text-4xl text-white">Your cart is empty</h1>
          <p className="mt-4 text-white/70">
            Add a few pieces to your bag and return here to complete your order.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--bg)]"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35rem] text-[var(--accent)]">Secure checkout</p>
            <h1 className="mt-3 text-4xl text-white">Complete your order</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Continue shopping
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-white/10 bg-[var(--surface)] p-6 md:p-8">
            <div>
              <h2 className="text-2xl text-white">Shipping details</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-white/70">
                First name
                <input
                  name="firstName"
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Jane"
                />
              </label>
              <label className="block text-sm text-white/70">
                Last name
                <input
                  name="lastName"
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Doe"
                />
              </label>
            </div>

            <label className="block text-sm text-white/70">
              Email address
              <input
                name="email"
                required
                type="email"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                placeholder="jane@example.com"
              />
            </label>

            <label className="block text-sm text-white/70">
              Street address
              <input
                name="address"
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                placeholder="123 High Street"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-white/70">
                City
                <input
                  name="city"
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Accra"
                />
              </label>
              <label className="block text-sm text-white/70">
                Country
                <input
                  name="country"
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Ghana"
                />
              </label>
            </div>

            <div>
              <h3 className="mb-4 text-2xl text-white">Payment</h3>
              <div className="rounded-[1.25rem] border border-white/10 bg-[#1b2029] p-4">
                <p className="text-sm text-white/70">Card details</p>
                <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-[#12181d] p-4 text-sm text-white/60">
                  Payment integration can be added here later.
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--bg)] transition hover:opacity-90"
            >
              Place order
            </button>
          </form>

          <aside className="rounded-[2rem] border border-white/10 bg-[var(--surface)] p-6 md:p-8">
            <h2 className="text-2xl text-white">Order summary</h2>

            <div className="mt-6 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-[1.25rem] border border-white/10 bg-[#1b2029] p-3">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white">{item.title}</p>
                        <p className="text-xs uppercase tracking-[0.2rem] text-[var(--accent)]/80">
                          {item.category}
                        </p>
                      </div>
                      <p className="text-sm text-white">{item.quantity}x</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--accent)]">{formatMoney(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3 border-t border-white/10 pt-5 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{formatMoney(shipping)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-lg text-white">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
