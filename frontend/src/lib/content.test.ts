import assert from "node:assert/strict";
import { test } from "node:test";
import { CueMockAdapter } from "./content/adapters/cue-mock-adapter";
import { WordPressAdapter } from "./content/adapters/wordpress-adapter";
import { getUnifiedArticles } from "./content/content-service";
import type { ContentAdapter } from "./content/content-adapter";
import type { NormalizedArticle } from "./content/normalized-article";

test("WordPressAdapter maps the API payload to NormalizedArticle", async () => {
  const previousApiUrl = process.env.WORDPRESS_API_URL;
  const originalFetch = globalThis.fetch;
  process.env.WORDPRESS_API_URL = "http://wordpress.test/wp-json/newshub/v1/";
  globalThis.fetch = async (input) => {
    assert.equal(
      String(input),
      "http://wordpress.test/wp-json/newshub/v1/articles?per_page=50",
    );

    return Response.json([
      {
        id: 42,
        slug: "industry-invests-in-skills",
        title: "Industry invests in skills",
        subtitle: "A new partnership",
        excerpt: "Companies are working with educators.",
        content: "<p>Article body</p>",
        date: "2025-11-06T08:30:00+00:00",
        link: "http://wordpress.test/industry-invests-in-skills",
        featured_image: null,
        categories: [{ id: 5, name: "Business", slug: "business" }],
        reading_time: 4,
        source_system: "wordpress",
      },
    ]);
  };

  try {
    const [article] = await new WordPressAdapter().getArticles();

    assert.deepEqual(article, {
      id: "wordpress-42",
      slug: "industry-invests-in-skills",
      title: "Industry invests in skills",
      subtitle: "A new partnership",
      excerpt: "Companies are working with educators.",
      contentHtml: "<p>Article body</p>",
      publishedAt: "2025-11-06T08:30:00.000Z",
      canonicalUrl: "http://wordpress.test/industry-invests-in-skills",
      featuredImageUrl: null,
      categories: [{ name: "Business", slug: "business" }],
      readingTimeMinutes: 4,
      source: "wordpress",
    });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironmentVariable("WORDPRESS_API_URL", previousApiUrl);
  }
});

test("WordPressAdapter rejects malformed article payloads", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json([{ id: 0 }]);

  try {
    await assert.rejects(
      new WordPressAdapter().getArticles(),
      /missing a valid id/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("CueMockAdapter maps its sample records to the shared contract", async () => {
  const articles = await new CueMockAdapter().getArticles();

  assert.equal(articles.length, 3);
  assert.ok(articles.every((article) => article.source === "cue"));
  assert.ok(articles.every((article) => article.contentHtml.startsWith("<p>")));
  assert.ok(articles.every((article) => article.categories.length > 0));
});

test("getUnifiedArticles merges adapters and sorts newest first", async () => {
  const wordpressArticle = makeArticle(
    "wordpress-1",
    "wordpress",
    "2025-11-01T10:00:00.000Z",
  );
  const cueArticle = makeArticle("cue-1", "cue", "2025-11-06T10:00:00.000Z");
  const olderCueArticle = makeArticle(
    "cue-2",
    "cue",
    "2025-10-30T10:00:00.000Z",
  );

  const adapters: ContentAdapter[] = [
    { getArticles: async () => [wordpressArticle, olderCueArticle] },
    { getArticles: async () => [cueArticle] },
  ];

  const articles = await getUnifiedArticles(adapters);

  assert.deepEqual(
    articles.map((article) => article.id),
    ["cue-1", "wordpress-1", "cue-2"],
  );
});

function makeArticle(
  id: string,
  source: NormalizedArticle["source"],
  publishedAt: string,
): NormalizedArticle {
  return {
    id,
    slug: id,
    title: id,
    subtitle: null,
    excerpt: id,
    contentHtml: `<p>${id}</p>`,
    publishedAt,
    canonicalUrl: `https://example.invalid/${id}`,
    featuredImageUrl: null,
    categories: [],
    readingTimeMinutes: null,
    source,
  };
}

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
