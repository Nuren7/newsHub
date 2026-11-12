import type { ContentAdapter } from "../content-adapter";
import type {
  ArticleCategory,
  ArticleSource,
  NormalizedArticle,
} from "../normalized-article";

const DEFAULT_WORDPRESS_API_URL =
  "http://localhost:8080/wp-json/newshub/v1";
const ARTICLES_PER_PAGE = 50;

export class WordPressAdapter implements ContentAdapter {
  async getArticles(): Promise<NormalizedArticle[]> {
    const apiUrl = (
      process.env.WORDPRESS_API_URL ?? DEFAULT_WORDPRESS_API_URL
    ).replace(/\/+$/, "");
    const response = await fetch(
      `${apiUrl}/articles?per_page=${ARTICLES_PER_PAGE}`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      throw new Error(
        `WordPress API request failed with status ${response.status}.`,
      );
    }

    const payload: unknown = await response.json();

    if (!Array.isArray(payload)) {
      throw new Error("WordPress API returned an invalid articles response.");
    }

    return payload.map(normalizeWordPressArticle);
  }
}

function normalizeWordPressArticle(value: unknown): NormalizedArticle {
  const record = asRecord(value);

  if (!record) {
    throw new Error("WordPress API returned an invalid article.");
  }

  const postId = requirePositiveInteger(record.id, "id");
  const slug = requireString(record.slug, "slug");
  const source = normalizeSource(record.source_system);
  const categories = normalizeCategories(record.categories);
  const publishedAt = normalizeDate(record.date);
  const readingTime = record.reading_time;

  if (
    readingTime !== undefined &&
    (typeof readingTime !== "number" ||
      !Number.isInteger(readingTime) ||
      readingTime < 0)
  ) {
    throw new Error(`WordPress article "${slug}" has an invalid reading_time.`);
  }

  return {
    id: `wordpress-${postId}`,
    slug,
    title: requireString(record.title, "title"),
    subtitle: optionalString(record.subtitle),
    excerpt: requireString(record.excerpt, "excerpt"),
    contentHtml: requireString(record.content, "content"),
    publishedAt,
    canonicalUrl: requireString(record.link, "link"),
    featuredImageUrl: optionalString(record.featured_image),
    categories,
    readingTimeMinutes:
      typeof readingTime === "number" && readingTime > 0 ? readingTime : null,
    source,
  };
}

function normalizeCategories(value: unknown): ArticleCategory[] {
  if (!Array.isArray(value)) {
    throw new Error("WordPress article has an invalid categories field.");
  }

  return value.map((category) => {
    const record = asRecord(category);

    if (!record) {
      throw new Error("WordPress article has an invalid category.");
    }

    return {
      name: requireString(record.name, "category name"),
      slug: requireString(record.slug, "category slug"),
    };
  });
}

function normalizeSource(value: unknown): ArticleSource {
  if (value === undefined || value === null || value === "") {
    return "wordpress";
  }

  if (value === "wordpress" || value === "cue") {
    return value;
  }

  throw new Error("WordPress article has an unsupported source_system.");
}

function normalizeDate(value: unknown): string {
  const dateValue = requireString(value, "date");
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error("WordPress article has an invalid date.");
  }

  return date.toISOString();
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("WordPress article contains a field that is not a string.");
  }

  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`WordPress article is missing a valid ${field}.`);
  }

  return value;
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    throw new Error(`WordPress article is missing a valid ${field}.`);
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
