"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NormalizedArticle } from "@/lib/content/normalized-article";

interface NewsFeedProps {
  articles: NormalizedArticle[];
}

export function NewsFeed({ articles }: NewsFeedProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, string>();

    for (const article of articles) {
      for (const category of article.categories) {
        categoryMap.set(category.slug, category.name);
      }
    }

    return [...categoryMap.entries()].sort((first, second) =>
      first[1].localeCompare(second[1]),
    );
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return articles.filter((article) => {
      const matchesSearch =
        query === "" ||
        [article.title, article.subtitle, article.excerpt]
          .filter((value): value is string => value !== null)
          .some((value) => value.toLocaleLowerCase().includes(query));
      const matchesCategory =
        selectedCategory === null ||
        article.categories.some(
          (category) => category.slug === selectedCategory,
        );

      return matchesSearch && matchesCategory;
    });
  }, [articles, search, selectedCategory]);

  return (
    <section aria-labelledby="feed-heading">
      <div className="flex flex-col gap-6 border-y border-[#d9dfd9] py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="feed-heading"
            className="text-2xl font-semibold tracking-tight text-[#183f33]"
          >
            Latest stories
          </h2>
          <p className="mt-1 text-sm text-[#63736a]">
            {filteredArticles.length}{" "}
            {filteredArticles.length === 1 ? "story" : "stories"}
          </p>
        </div>
        <label className="flex w-full flex-col gap-2 text-sm font-medium text-[#364b40] sm:max-w-sm">
          Search stories
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search headlines and summaries"
            className="h-11 rounded-md border border-[#cbd5cc] bg-white px-3 text-base font-normal text-[#182521] outline-none transition focus:border-[#32634e] focus:ring-2 focus:ring-[#32634e]/20"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 py-5" aria-label="Filter by category">
        <button
          type="button"
          aria-pressed={selectedCategory === null}
          onClick={() => setSelectedCategory(null)}
          className={categoryButtonClass(selectedCategory === null)}
        >
          All topics
        </button>
        {categories.map(([slug, name]) => (
          <button
            key={slug}
            type="button"
            aria-pressed={selectedCategory === slug}
            onClick={() =>
              setSelectedCategory(selectedCategory === slug ? null : slug)
            }
            className={categoryButtonClass(selectedCategory === slug)}
          >
            {name}
          </button>
        ))}
      </div>

      {filteredArticles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="flex min-h-64 flex-col rounded-lg border border-[#d9dfd9] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#9cad9e] hover:shadow-md"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
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
                  className="text-xs text-[#63736a]"
                >
                  {formatDate(article.publishedAt)}
                </time>
              </div>
              <Link
                href={`/article/${encodeURIComponent(article.slug)}`}
                className="group"
              >
                <h3 className="text-xl font-semibold leading-snug tracking-tight text-[#183f33] group-hover:text-[#32634e]">
                  {article.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#53625a]">
                  {article.subtitle ?? article.excerpt}
                </p>
              </Link>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {article.categories.map((category) => (
                  <span
                    key={`${article.id}-${category.slug}`}
                    className="text-xs text-[#63736a]"
                  >
                    {category.name}
                  </span>
                ))}
                {article.readingTimeMinutes !== null && (
                  <span className="ml-auto text-xs text-[#63736a]">
                    {article.readingTimeMinutes} min read
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#cbd5cc] px-6 py-12 text-center">
          <p className="font-medium text-[#183f33]">No stories found</p>
          <p className="mt-2 text-sm text-[#63736a]">
            Try another search or clear the selected topic.
          </p>
        </div>
      )}
    </section>
  );
}

function categoryButtonClass(selected: boolean): string {
  return selected
    ? "rounded-full bg-[#183f33] px-4 py-2 text-sm font-medium text-white"
    : "rounded-full border border-[#cbd5cc] bg-white px-4 py-2 text-sm font-medium text-[#364b40] transition hover:border-[#78917f]";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-SE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}
