import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FirstSale | AI Business Roadmap Generator",
  description: "Generate your custom business plan and get your first sale fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}