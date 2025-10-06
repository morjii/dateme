"use client";
import { useState } from "react";
import type { CartItem } from "@/types/cart";

export default function CheckoutButton({ items }: { items: CartItem[] }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      window.location.href = data.url; // redirection vers Stripe Checkout
    } catch (e:any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="rounded-xl px-4 py-2 bg-black text-white"
    >
      {loading ? "Redirection..." : "Payer"}
    </button>
  );
}
