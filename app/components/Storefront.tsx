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
const supportedCurrencies = ["USD", "EUR", "GBP", "AED", "SAR", "CAD", "AUD", "GHS"];

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({ USD: 1 });

  const formatMoney = (amount: number) => {
    const rate = currencyRates[currencyCode] ?? 1;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount * rate);
  };

  useEffect(() => {
    const saved = localStorage.getItem("tinnah-cart");
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch {
        setCartItems([]);
      }
    }

    const savedCurrency = localStorage.getItem("tinnah-currency");
    if (savedCurrency) {
      setCurrencyCode(savedCurrency);
    }

    void fetchProducts();
    void fetchCurrency();
    void fetchRates();
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
      if (data.currency && !localStorage.getItem("tinnah-currency")) {
        setCurrencyCode(data.currency);
        localStorage.setItem("tinnah-currency", data.currency);
      }
    } catch {
      if (!localStorage.getItem("tinnah-currency")) {
        setCurrencyCode("USD");
      }
    }
  };

  const fetchRates = async () => {
    try {
      const targets = supportedCurrencies.filter((item) => item !== "USD");
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${targets.join(",")}`,
      );
      const data = (await response.json()) as { rates?: Record<string, number> };
      if (!data.rates) {
        return;
      }

      setCurrencyRates({
        USD: 1,
        ...data.rates,
      });
    } catch {
      setCurrencyRates({ USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75, CAD: 1.36, AUD: 1.5, GHS: 15.3 });
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

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortOrder === "price-low") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-high") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "featured") {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return sorted;
  }, [filteredProducts, sortOrder]);

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

  const updateCurrency = (nextCurrency: string) => {
    const selected = supportedCurrencies.includes(nextCurrency) ? nextCurrency : "USD";
    setCurrencyCode(selected);
    localStorage.setItem("tinnah-currency", selected);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-3 px-3 py-3 sm:px-5 lg:flex-nowrap lg:px-8">
          <a href="/" className="min-w-0 flex-1 lg:flex-none" aria-label="A.M Tinnah's Collections home">
            <p className="text-[9px] uppercase tracking-[0.22rem] text-[var(--accent)]/80 sm:text-[10px]">
              Curated fashion
            </p>
            <h1 className="truncate text-sm font-semibold text-[var(--text)] sm:text-lg">
              A.M Tinnah&apos;s Collections
            </h1>
          </a>

          <label className="order-3 flex h-10 w-full overflow-hidden rounded-lg border border-white/15 bg-white text-[#202734] focus-within:ring-2 focus-within:ring-[var(--accent)] lg:order-2 lg:h-11 lg:flex-1">
            <span className="flex items-center border-r border-gray-200 px-3 text-xs text-gray-600 sm:text-sm">
              Search
            </span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search clothing, shoes, bags..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#202734] placeholder:text-gray-500 focus:outline-none"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="px-3 text-xs font-medium text-gray-600 hover:text-black"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </label>

          <div className="order-2 flex shrink-0 items-center gap-2 lg:order-3 lg:gap-3">
            <label className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2 py-2 text-[10px] text-white/80 sm:gap-2 sm:px-3 sm:text-xs">
              <span className="hidden sm:inline">Currency</span>
              <select
                value={currencyCode}
                onChange={(event) => updateCurrency(event.target.value)}
                aria-label="Currency"
                className="max-w-[4.5rem] bg-transparent text-xs text-white outline-none sm:text-sm"
              >
                {supportedCurrencies.map((option) => (
                  <option key={option} value={option} className="bg-[#1d232b] text-white">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3 text-xs font-medium text-[var(--bg)] transition hover:opacity-90 sm:px-4 sm:text-sm"
            >
              Cart
              <span className="rounded-full bg-[var(--bg)] px-1.5 py-0.5 text-[10px] text-[var(--accent)] sm:text-xs">
                {cartItems.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </button>
          </div>
        </div>

        <nav aria-label="Product categories" className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-3 py-2 sm:px-5 lg:px-8">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
                className={`shrink-0 rounded-md px-3 py-2 text-xs transition sm:text-sm ${
                  selectedCategory === category
                    ? "bg-white/10 text-[var(--accent)]"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                {category === "All" ? "All products" : category}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2rem] text-[var(--accent)] sm:text-xs">
              {selectedCategory === "All" ? "Shop collection" : selectedCategory}
            </p>
            <h2 className="mt-1 text-xl text-white sm:text-2xl">
              {selectedCategory === "All" ? "Explore the collection" : `Shop ${selectedCategory}`}
            </h2>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
              {searchText ? ` matching “${searchText}”` : " available"}
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs text-white/70 sm:text-sm">
            <span>Sort by</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="rounded-md border border-white/15 bg-[var(--surface)] px-2.5 py-2 text-xs text-white outline-none focus:border-[var(--accent)] sm:text-sm"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-7">
          <aside className="hidden lg:block">
            <h3 className="mb-3 text-sm font-semibold text-white">Departments</h3>
            <ul className="space-y-1 border-b border-white/10 pb-4">
              {categories.map((category) => {
                const count = category === "All"
                  ? products.length
                  : products.filter((product) => product.category === category).length;
                return (
                  <li key={category}>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      aria-pressed={selectedCategory === category}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm ${
                        selectedCategory === category
                          ? "bg-white/10 text-[var(--accent)]"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{category === "All" ? "All products" : category}</span>
                      <span className="text-xs text-white/45">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="pt-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Shopping</h3>
              <p className="text-xs leading-5 text-white/55">
                Curated pieces for everyday wear and special occasions.
              </p>
            </div>
          </aside>

          <section aria-label="Products">
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {sortedProducts.map((product) => (
                  <article
                    key={product.id}
                    className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[var(--surface)] transition hover:border-[var(--accent)]/60"
                  >
                    <div className="relative aspect-[4/5] bg-[#1a1f27]">
                      <img
                        src={product.imageUrl || fallbackImage}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="absolute bottom-2 left-2 rounded-md border border-white/20 bg-black/60 px-2.5 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm sm:bottom-3 sm:left-3 sm:text-xs"
                      >
                        Quick view
                      </button>
                    </div>

                    <div className="flex min-h-[150px] flex-col p-3 sm:min-h-[172px] sm:p-4">
                      <p className="text-[9px] uppercase tracking-[0.16rem] text-[var(--accent)] sm:text-[10px]">
                        {product.category}
                      </p>
                      <h3 className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-white sm:text-sm">
                        {product.title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-white sm:text-base">
                        {formatMoney(product.price)}
                      </p>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="mt-auto w-full rounded-md bg-[var(--accent)] px-2 py-2 text-[10px] font-semibold text-[var(--bg)] transition hover:opacity-90 sm:py-2.5 sm:text-xs"
                      >
                        Add to cart
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/20 bg-[var(--surface)] px-5 py-12 text-center text-sm text-white/70">
                No products match your search. Try another keyword or category.
              </div>
            )}
          </section>
        </div>
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
              <a
                href="/checkout"
                className="mt-4 block w-full rounded-full bg-[var(--accent)] px-4 py-3 text-center text-sm font-medium text-[var(--bg)]"
              >
                Checkout
              </a>
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
                    onClick={() => {
                      setSelectedProduct(null);
                      setIsCartOpen(true);
                    }}
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
