import { Sarabun } from "next/font/google";
import "./globals.css";
import { generateMetadata as genMetadata } from "@/lib/seo";

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata = genMetadata({});

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
