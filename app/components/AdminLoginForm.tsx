"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("@123Basil");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as { token?: string; error?: string };

      if (!response.ok || !data.token) {
        setError(data.error ?? "Authentication failed.");
        setLoading(false);
        return;
      }

      localStorage.setItem("tinnah-admin-token", data.token);
      router.push("/admin/dashboard");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[var(--surface)] p-8 shadow-2xl shadow-black/20">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.35rem] text-[var(--accent)]">Admin access</p>
          <h1 className="mt-4 text-3xl text-white">Tinnah Collections</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm text-white/70">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none ring-0 transition focus:border-[var(--accent)]"
              placeholder="Admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-white/70">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1d232b] px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Authenticating..." : "Login to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
