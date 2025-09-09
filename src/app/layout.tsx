import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { Footer } from "@/components/ui/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Visitor Experience",
  description:
    "Visitor experience application for TUM Blockchain Conference 2025",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Theme accentColor="violet" grayColor="mauve" radius="small">
            <div className="min-h-dvh flex flex-col">
              <main className="flex-1 grow">{children}</main>
              <Footer />
            </div>
          </Theme>
        </SessionProvider>
      </body>
    </html>
  );
}
