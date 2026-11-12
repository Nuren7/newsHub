"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#805c20]">
        Content unavailable
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#183f33]">
        We couldn&apos;t load the NewsHub feed.
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-[#53625a]">
        Check that the WordPress API is running and that WORDPRESS_API_URL is
        configured correctly, then try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-8 w-fit rounded-md bg-[#183f33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#32634e]"
      >
        Try again
      </button>
    </main>
  );
}
