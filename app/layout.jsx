import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { auth0 } from "@/lib/auth0";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Hackathon Judge",
  description: "Discover, submit, and judge hackathon projects.",
};

export default async function RootLayout({ children }) {
  const session = await auth0.getSession();
  const user = session?.user ?? null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const stored = localStorage.getItem("hackathon-judge-theme");
                const theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                document.documentElement.classList.toggle("dark", theme === "dark");
              })();
            `,
          }}
        />
        <Header user={user} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
