"use client";

import { useEffect, useMemo, useState } from "react";

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

type CartItem = Product & { quantity: number };

const fallbackImage =
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80";

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currencyCode, setCurrencyCode] = useState("USD");

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);

  useEffect(() => {
    const saved = localStorage.getItem("tinnah-cart");
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch {
        setCartItems([]);
      }
    }

    void fetchProducts();
    void fetchCurrency();
  }, []);

  useEffect(() => {
    localStorage.setItem("tinnah-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const fetchProducts = async () => {
    const response = await fetch("/api/products");
    const data = (await response.json()) as Product[];
    setProducts(data);
  };

  const fetchCurrency = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = (await response.json()) as { currency?: string };
      if (data.currency) {
        setCurrencyCode(data.currency);
      }
    } catch {
      setCurrencyCode("USD");
    }
  };

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const query = searchText.toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchText, selectedCategory]);

  const addToCart = (product: Product) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCartItems((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35rem] text-[var(--accent)]/80">
              Curated icons
            </p>
            <h1 className="text-2xl font-semibold tracking-wide text-[var(--text)]">
              Tinnah Collections
            </h1>
          </div>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-[var(--surface)] px-4 py-2 shadow-lg shadow-black/10">
              <span className="text-lg text-[var(--accent)]">⌕</span>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search signature looks"
                className="w-full bg-transparent text-sm text-[var(--text)] placeholder:text-white/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-5 text-sm text-white/80 md:flex">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`transition hover:text-[var(--accent)] ${
                    selectedCategory === category ? "text-[var(--accent)]" : ""
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition hover:opacity-90"
            >
              Cart
              <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--accent)]">
                {cartItems.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <section className="mb-8 grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--surface)] p-6 shadow-2xl shadow-black/20 md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-xs uppercase tracking-[0.4rem] text-[var(--accent)]">
              New Season Edit
            </p>
            <h2 className="max-w-lg text-4xl leading-tight text-white md:text-5xl">
              Statement pieces designed for every grand entrance.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-white/70">
              Discover luxury silhouettes, elevated essentials, and timeless accessories curated for your next unforgettable moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--bg)] transition hover:opacity-90"
              >
                Shop collection
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct(products[0] ?? null)}
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                View highlight
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1a1f27]">
              <img
                src={products[0]?.imageUrl ?? fallbackImage}
                alt={products[0]?.title ?? "Luxury apparel"}
                className="h-56 w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-between rounded-[1.5rem] border border-white/10 bg-[#1d232b] p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3rem] text-[var(--accent)]">Featured</p>
                <h3 className="mt-3 text-2xl text-white">Modern Luxe</h3>
              </div>
              <div className="mt-6 text-sm text-white/70">
                <p>Limited edition</p>
                <p className="mt-2 text-3xl font-medium text-[var(--accent)]">
                  {formatMoney(products[0]?.price ?? 160)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35rem] text-[var(--accent)]">Collection</p>
            <h3 className="mt-2 text-3xl text-white">Premium essentials</h3>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedCategory === category
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                    : "border-white/15 bg-transparent text-white/70 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[var(--surface)] transition hover:-translate-y-1 hover:border-[var(--accent)]/70"
            >
              <div className="relative">
                <img
                  src={product.imageUrl || fallbackImage}
                  alt={product.title}
                  className="h-72 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs uppercase tracking-[0.2rem] text-white backdrop-blur-sm"
                >
                  Quick View
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2rem] text-[var(--accent)]/80">
                      {product.category}
                    </p>
                    <h4 className="mt-2 text-xl text-white">{product.title}</h4>
                  </div>
                  <span className="text-lg font-medium text-[var(--accent)]">
                    {formatMoney(product.price)}
                  </span>
                </div>

                <p className="line-clamp-3 text-sm leading-6 text-white/65">{product.description}</p>

                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] transition hover:opacity-90"
                >
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-10 rounded-[1.5rem] border border-dashed border-white/20 bg-[var(--surface)] p-12 text-center text-white/70">
            No products match your search. Try another keyword or category.
          </div>
        )}
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsCartOpen(false)}>
          <aside
            className="ml-auto flex h-full w-full max-w-md flex-col bg-[var(--surface)] p-6 text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3rem] text-[var(--accent)]">Your bag</p>
                <h3 className="mt-2 text-2xl">Cart</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/70"
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-white/15 p-6 text-center text-white/60">
                  Your cart is empty.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-[1.25rem] border border-white/10 bg-[#1c2128] p-3"
                  >
                    <img src={item.imageUrl || fallbackImage} alt={item.title} className="h-20 w-20 rounded-xl object-cover" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-base text-white">{item.title}</p>
                          <p className="mt-1 text-sm text-[var(--accent)]">{formatMoney(item.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -item.quantity)}
                          className="text-sm text-white/60 hover:text-[var(--accent)]"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#12171d] px-2 py-1">
                          <button type="button" onClick={() => updateCartQuantity(item.id, -1)} className="px-2 text-lg text-white/80">−</button>
                          <span className="min-w-4 text-center text-sm text-white">{item.quantity}</span>
                          <button type="button" onClick={() => updateCartQuantity(item.id, 1)} className="px-2 text-lg text-white/80">+</button>
                        </div>
                        <span className="text-sm text-white">{formatMoney(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[#1a2027] p-4">
              <div className="flex items-center justify-between text-white/70">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)]"
              >
                Checkout
              </button>
            </div>
          </aside>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedProduct(null)}>
          <div
            className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--surface)] text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid md:grid-cols-2">
              <div className="bg-[#1b2029] p-4">
                <img src={selectedProduct.imageUrl || fallbackImage} alt={selectedProduct.title} className="h-full max-h-[480px] w-full rounded-[1.5rem] object-cover" />
              </div>

              <div className="p-6 md:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.3rem] text-[var(--accent)]">
                    {selectedProduct.category}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-sm text-white/60 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <h3 className="text-3xl text-white">{selectedProduct.title}</h3>
                <p className="mt-4 text-2xl text-[var(--accent)]">{formatMoney(selectedProduct.price)}</p>
                <p className="mt-6 text-base leading-7 text-white/70">{selectedProduct.description}</p>

                <div className="mt-6">
                  <p className="mb-3 text-sm uppercase tracking-[0.2rem] text-white/60">Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((size) => (
                      <span
                        key={size}
                        className="rounded-full border border-white/10 bg-[#1d232b] px-3 py-2 text-sm text-white"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => addToCart(selectedProduct)}
                    className="flex-1 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)]"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="rounded-full border border-white/15 px-4 py-3 text-sm text-white"
                  >
                    View Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
