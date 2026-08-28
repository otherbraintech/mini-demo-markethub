import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OB-AutoPost Client Demo | Pasarela OAuth & Autoposting",
  description:
    "Demostración de aplicación SaaS en Next.js utilizando OB-AutoPost como pasarela de autenticación OAuth multired y publicación automática de contenido.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased bg-[#080c14] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
