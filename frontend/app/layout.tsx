import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Boutique",
  description: "Site e-commerce test",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900">
        <header className="p-4 bg-white shadow flex justify-between">
          <Link href="/">🏠 Home</Link>
          <Link href="/cart">🛒 Panier</Link>
        </header>
        <main className="max-w-4xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
