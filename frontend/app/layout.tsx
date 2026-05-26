import type { Metadata } from "next";
import { Kalam, Patrick_Hand } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const kalam = Kalam({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-kalam",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-patrick-hand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: "Student LMS - Knowledge Archive",
  description:
    "A modern learning management system for students and faculty. Access organized resources, real-time collaboration, and smart video learning.",
  keywords: [
    "LMS",
    "Learning Management System",
    "Education",
    "Campus",
    "University",
    "Students",
    "Faculty",
  ],
  authors: [{ name: "Shyam Yemuka" }],
  openGraph: {
    title: "Student LMS - Knowledge Archive",
    description: "Modern learning management system for education",
    type: "website",
    images: ["/images/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${kalam.variable} ${patrickHand.variable} font-body antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--color-bg-card, #14181D)",
                border: "2px solid var(--color-border, #BFA55A)",
                color: "var(--color-text-primary, #EAEAEA)",
                fontFamily: "var(--font-patrick-hand), sans-serif",
                borderRadius: "8px 16px 8px 16px / 16px 8px 16px 8px",
                boxShadow: "3px 3px 0px 0px var(--color-shadow, #2d2d2d)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
