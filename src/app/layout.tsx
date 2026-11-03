import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visualizador de Pisos · Prueba antes de comprar",
  description:
    "Sube una foto de tu espacio y visualiza cómo quedaría con cualquiera de nuestros pisos. Sin compromiso, sin instalar nada.",
  keywords: ["pisos", "visualizador", "diseño de interiores", "Terza", "vinílicos", "laminados", "porcelanato"],
  authors: [{ name: "Visualizador de Pisos" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
