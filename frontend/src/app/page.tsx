import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { NewsFeed } from "@/components/news-feed";
import { getUnifiedArticles } from "@/lib/content/content-service";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
      <header className="flex items-center justify-between border-b border-[#d9dfd9] py-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[#183f33]"
        >
          NewsHub
        </Link>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#63736a]">
          Business &amp; society
        </span>
      </header>

      <section className="py-14 sm:py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#557665]">
          The latest
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#183f33] sm:text-6xl">
          Stories shaping business and society.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#53625a]">
          A unified editorial feed bringing together reporting from WordPress
          and a clearly marked CUE integration mock.
        </p>
      </section>

      <Suspense fallback={<FeedLoading />}>
        <FeedContent />
      </Suspense>
    </main>
  );
}

async function FeedContent() {
  await connection();
  const articles = await getUnifiedArticles();

  return <NewsFeed articles={articles} />;
}

function FeedLoading() {
  return (
    <p
      role="status"
      className="border-y border-[#d9dfd9] py-8 text-sm text-[#63736a]"
    >
      Loading the latest stories…
    </p>
  );
}
