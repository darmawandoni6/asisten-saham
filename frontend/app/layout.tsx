import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Asisten Saham — IDX EOD Decision Copilot",
  description: "Asisten Saham pintar harian untuk investor dan trader saham Bursa Efek Indonesia (IDX)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 flex min-h-screen selection:bg-emerald-600 selection:text-white antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {children}
        </div>
      </body>
    </html>
  );
}
