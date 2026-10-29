"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  sizes: string[];
  featured: boolean;
};

type ProductForm = {
  title: string;
  price: string;
  category: string;
  description: string;
  imageUrl: string;
  sizes: string;
};

const emptyForm: ProductForm = {
  title: "",
  price: "",
  category: "Accessories",
  description: "",
  imageUrl: "",
  sizes: "One Size",
};

const currencyOptions = ["USD", "EUR", "GBP", "AED", "SAR", "CAD", "AUD", "GHS"];

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; total: number; customer: string; status: string; currency: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({ USD: 1 });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  useEffect(() => {
    void loadProducts();
    void loadCurrency();
    void loadRates();
    void loadRecentOrders();
  }, []);

  const loadCurrency = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = (await response.json()) as { currency?: string };
      if (data.currency) {
        setCurrency(data.currency);
      }
    } catch {
      setCurrency("USD");
    }
  };

  const loadRates = async () => {
    try {
      const targets = currencyOptions.filter((item) => item !== "USD");
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${targets.join(",")}`,
      );
      const data = (await response.json()) as { rates?: Record<string, number> };
      if (!data.rates) {
        return;
      }

      setCurrencyRates({ USD: 1, ...data.rates });
    } catch {
      setCurrencyRates({ USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75, CAD: 1.36, AUD: 1.5, GHS: 15.3 });
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = (await response.json()) as Product[];
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = (await response.json()) as Array<{
        id: string;
        total: number;
        currency: string;
        customer: { firstName: string; lastName: string };
        status: string;
      }>;

      setRecentOrders(
        (data ?? [])
          .slice(0, 4)
          .map((order) => ({
            id: order.id,
            total: order.total,
            currency: order.currency,
            customer: `${order.customer.firstName} ${order.customer.lastName}`,
            status: order.status,
          })),
      );
    } catch {
      setRecentOrders([]);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedImage(null);
    setEditingId(null);
  };

  const handleCurrencyChange = async (nextCurrency: string) => {
    const normalized = currencyOptions.includes(nextCurrency.toUpperCase())
      ? nextCurrency.toUpperCase()
      : "USD";
    setCurrency(normalized);

    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: normalized }),
      });
    } catch {
      window.alert("Unable to update the storefront currency.");
    }
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setSelectedImage(null);
      return;
    }

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      window.alert("Please select an image file.");
      setSelectedImage(null);
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Image read failed"));
      reader.readAsDataURL(file);
    });

    setSelectedImage(file);
    setForm((current) => ({ ...current, imageUrl: dataUrl }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const imageValue =
      form.imageUrl && form.imageUrl.trim().length > 0
        ? form.imageUrl.trim()
        : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80";

    const payload = {
      title: form.title,
      price: Number(form.price),
      category: form.category,
      description: form.description,
      imageUrl: imageValue,
      gallery: [imageValue],
      sizes: form.sizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),
      featured: true,
    };

    const route = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";

    const response = await fetch(route, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      window.alert("Unable to save the product.");
      return;
    }

    resetForm();
    await loadProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      price: String(product.price),
      category: product.category,
      description: product.description,
      imageUrl: product.imageUrl,
      sizes: product.sizes.join(", "),
    });
    setSelectedImage(null);
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Remove this product from the catalog?");
    if (!ok) {
      return;
    }

    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      window.alert("Removal failed.");
      return;
    }

    await loadProducts();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore and continue to redirect
    }
    router.push("/");
  };

  const formatMoney = (amount: number) => {
    const rate = currencyRates[currency] ?? 1;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount * rate);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-3 py-5 text-[var(--text)] sm:px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 sm:rounded-[2rem] sm:p-6 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25rem] text-[var(--accent)] sm:text-xs">
              Admin panel
            </p>
            <h1 className="mt-2 text-2xl text-white sm:mt-3 sm:text-3xl">Dashboard</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href="/admin/orders"
              className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/80 transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-4 sm:text-sm"
            >
              Orders
            </a>

            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1d232b] px-2.5 py-2 text-xs text-white/80 sm:px-3 sm:text-sm">
              <span>Currency</span>
              <select
                value={currency}
                onChange={(event) => void handleCurrencyChange(event.target.value)}
                className="bg-transparent text-white outline-none"
              >
                {currencyOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#1d232b] text-white">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/80 transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-4 sm:text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4">
            <p className="text-[10px] uppercase tracking-[0.25rem] text-white/60">Products</p>
            <p className="mt-3 text-2xl text-white">{products.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4">
            <p className="text-[10px] uppercase tracking-[0.25rem] text-white/60">Orders</p>
            <p className="mt-3 text-2xl text-white">{recentOrders.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 md:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.25rem] text-white/60">Latest orders</p>
            <div className="mt-3 space-y-2 text-xs text-white/80 sm:text-sm">
              {recentOrders.length === 0 ? (
                <p>No orders yet.</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1d232b] px-3 py-2">
                    <div>
                      <p className="text-white">{order.customer}</p>
                      <p className="text-[10px] uppercase tracking-[0.2rem] text-[var(--accent)]">{order.status}</p>
                    </div>
                    <p className="text-[var(--accent)]">{new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency || "USD" }).format(order.total)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 sm:rounded-[2rem] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
              <h2 className="text-xl text-white sm:text-2xl">
                {editingId ? "Edit product" : "Add new product"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-[var(--accent)] hover:opacity-80 sm:text-sm"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-2 block text-xs text-white/70 sm:text-sm">Title</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] sm:px-4 sm:py-3 sm:text-base"
                  placeholder="Luxury silk dress"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <div>
                  <label className="mb-2 block text-xs text-white/70 sm:text-sm">Price</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] sm:px-4 sm:py-3 sm:text-base"
                    placeholder="199"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/70 sm:text-sm">Category</label>
                  <select
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] sm:px-4 sm:py-3 sm:text-base"
                  >
                    <option value="Accessories">Accessories</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Bags">Bags</option>
                    <option value="Jewelry">Jewelry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/70 sm:text-sm">Sizes</label>
                <input
                  value={form.sizes}
                  onChange={(event) => setForm({ ...form, sizes: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] sm:px-4 sm:py-3 sm:text-base"
                  placeholder="XS, S, M, L"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/70 sm:text-sm">Product image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-dashed border-white/10 bg-[#1d232b] px-3 py-2.5 text-xs text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[var(--bg)] sm:px-4 sm:py-3 sm:text-sm"
                />
                {selectedImage && (
                  <p className="mt-2 text-xs text-[var(--accent)]">
                    {selectedImage.name} selected
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/70 sm:text-sm">Image URL (optional fallback)</label>
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] sm:px-4 sm:py-3 sm:text-base"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/70 sm:text-sm">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] sm:px-4 sm:py-3 sm:text-base"
                  placeholder="Product details and material notes"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] transition hover:opacity-90 sm:py-3"
              >
                {editingId ? "Update product" : "Add product"}
              </button>
            </form>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-[var(--surface)] p-4 sm:rounded-[2rem] sm:p-6">
            <div className="mb-5 flex items-center justify-between sm:mb-6">
              <h2 className="text-xl text-white sm:text-2xl">Catalog</h2>
              <span className="rounded-full border border-white/10 bg-[#1d232b] px-2.5 py-1 text-xs text-[var(--accent)] sm:px-3 sm:text-sm">
                {products.length} items
              </span>
            </div>

            {isLoading ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center text-white/60">
                Loading catalog...
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#1b2029] p-4 md:flex-row"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-24 w-full rounded-[1rem] object-cover sm:h-28 md:w-28"
                    />

                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2rem] text-[var(--accent)] sm:text-xs">
                            {product.category}
                          </p>
                          <h3 className="mt-2 text-base text-white sm:text-xl">{product.title}</h3>
                        </div>
                        <span className="text-sm text-[var(--accent)] sm:text-base">
                          {formatMoney(product.price)}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">{product.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs text-[var(--bg)] sm:px-4 sm:py-2 sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs text-red-200 sm:px-4 sm:py-2 sm:text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
