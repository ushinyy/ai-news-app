import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SignInGate } from "@/components/sign-in-gate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 뉴스 수집기",
  description: "AI 뉴스를 수집하고 한국어로 요약합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <main className="flex flex-1 items-center justify-center p-8">
              <h1 className="text-2xl font-semibold">AI 뉴스 수집기</h1>
            </main>
          }
        >
          <ClerkProvider>
            <Show when="signed-out">
              <SignInGate />
            </Show>
            <Show when="signed-in">
              <header className="flex justify-end p-4">
                <UserButton />
              </header>
              {children}
            </Show>
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  );
}
