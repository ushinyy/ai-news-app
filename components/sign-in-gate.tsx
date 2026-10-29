"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export function SignInGate() {
  const { openSignIn, loaded } = useClerk();

  useEffect(() => {
    if (loaded) openSignIn({});
  }, [loaded, openSignIn]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">AI 뉴스 수집기</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        계속하려면 로그인해 주세요.
      </p>
      <button
        type="button"
        onClick={() => openSignIn({})}
        className="rounded-full bg-black px-5 py-2 text-white dark:bg-white dark:text-black"
      >
        로그인
      </button>
    </main>
  );
}
