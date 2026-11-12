export type ArticleSource = "wordpress" | "cue";

export interface ArticleCategory {
  name: string;
  slug: string;
}

export interface NormalizedArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  contentHtml: string;
  publishedAt: string;
  canonicalUrl: string;
  featuredImageUrl: string | null;
  categories: ArticleCategory[];
  readingTimeMinutes: number | null;
  source: ArticleSource;
}
