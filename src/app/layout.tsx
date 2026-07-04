import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareCard",
  description:
    "Prepare a clear, one-page document for medical and care appointments.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
