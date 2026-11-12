import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { getUnifiedArticles } from "@/lib/content/content-service";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return (
    <Suspense fallback={<ArticleLoading />}>
      <ArticleContent params={params} />
    </Suspense>
  );
}

async function ArticleContent({ params }: ArticlePageProps) {
  await connection();
  const { slug } = await params;
  const articles = await getUnifiedArticles();
  const article = articles.find((item) => item.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-8">
      <header className="border-b border-[#d9dfd9] py-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[#183f33]"
        >
          NewsHub
        </Link>
      </header>

      <article className="pt-12 sm:pt-16">
        <Link
          href="/"
          className="text-sm font-medium text-[#557665] hover:text-[#183f33]"
        >
          ← All stories
        </Link>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span
            className={
              article.source === "cue"
                ? "rounded-full bg-[#f5ecd8] px-3 py-1 text-xs font-semibold text-[#805c20]"
                : "rounded-full bg-[#e6f0e9] px-3 py-1 text-xs font-semibold text-[#32634e]"
            }
          >
            {article.source === "cue" ? "CUE · mock" : "WordPress"}
          </span>
          <time
            dateTime={article.publishedAt}
            className="text-sm text-[#63736a]"
          >
            {formatDate(article.publishedAt)}
          </time>
          {article.readingTimeMinutes !== null && (
            <span className="text-sm text-[#63736a]">
              {article.readingTimeMinutes} min read
            </span>
          )}
        </div>
        {article.categories.length > 0 && (
          <p className="mt-5 text-sm font-medium text-[#557665]">
            {article.categories.map((category) => category.name).join(" · ")}
          </p>
        )}
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-[#183f33] sm:text-5xl">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="mt-5 text-xl leading-8 text-[#53625a]">
            {article.subtitle}
          </p>
        )}
        <div
          className="mt-10 max-w-none space-y-6 text-lg leading-8 text-[#384b40] [&_a]:font-medium [&_a]:text-[#32634e] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#9cad9e] [&_blockquote]:pl-5 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#183f33] [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#183f33] [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-8 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      </article>
    </main>
  );
}

function ArticleLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-8">
      <header className="border-b border-[#d9dfd9] py-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[#183f33]"
        >
          NewsHub
        </Link>
      </header>
      <p role="status" className="py-12 text-sm text-[#63736a]">
        Loading story…
      </p>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-SE", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}
