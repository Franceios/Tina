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

const emptyForm = {
  title: "",
  price: "",
  category: "Accessories",
  description: "",
  imageUrl: "",
  sizes: "One Size",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tinnah-admin-token") : null;
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    void loadProducts();
  }, [router]);

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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      title: form.title,
      price: Number(form.price),
      category: form.category,
      description: form.description,
      imageUrl: form.imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
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

  const handleLogout = () => {
    localStorage.removeItem("tinnah-admin-token");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[var(--surface)] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35rem] text-[var(--accent)]">Admin panel</p>
            <h1 className="mt-3 text-3xl text-white">Dashboard</h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Logout
          </button>
        </header>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-white/10 bg-[var(--surface)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl text-white">
                {editingId ? "Edit product" : "Add new product"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-[var(--accent)] hover:opacity-80"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/70">Title</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Luxury silk dress"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Price</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                    placeholder="199"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Category</label>
                  <select
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
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
                <label className="mb-2 block text-sm text-white/70">Sizes</label>
                <input
                  value={form.sizes}
                  onChange={(event) => setForm({ ...form, sizes: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="XS, S, M, L"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Image URL</label>
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Product details and material notes"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] transition hover:opacity-90"
              >
                {editingId ? "Update product" : "Add product"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[var(--surface)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl text-white">Catalog</h2>
              <span className="rounded-full border border-white/10 bg-[#1d232b] px-3 py-1 text-sm text-[var(--accent)]">
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
                      className="h-28 w-full rounded-[1rem] object-cover md:w-28"
                    />

                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25rem] text-[var(--accent)]">
                            {product.category}
                          </p>
                          <h3 className="mt-2 text-xl text-white">{product.title}</h3>
                        </div>
                        <span className="text-base text-[var(--accent)]">
                          {currency.format(product.price)}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-white/70">{product.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm text-[var(--bg)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-full border border-red-500/50 px-4 py-2 text-sm text-red-200"
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
