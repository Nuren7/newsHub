import type { ContentAdapter } from "../content-adapter";
import type { NormalizedArticle } from "../normalized-article";

interface CueMockArticle {
  id: string;
  slug: string;
  headline: string;
  standfirst: string;
  body: string;
  publishedAt: string;
  sections: string[];
  minutesToRead: number;
}

const MOCK_ARTICLES: CueMockArticle[] = [
  {
    id: "cue-article-001",
    slug: "swedish-industry-invests-in-skills",
    headline: "Swedish industry steps up investment in new skills",
    standfirst:
      "Companies are working with educators to prepare people for a changing labour market.",
    body:
      "Across Sweden, employers are building partnerships that connect practical experience with lifelong learning. The initiatives bring businesses, schools and regional organisations together to identify the skills that will matter in the years ahead.",
    publishedAt: "2025-11-06T09:30:00+01:00",
    sections: ["Business", "Labour market"],
    minutesToRead: 4,
  },
  {
    id: "cue-article-002",
    slug: "exporters-navigate-changing-markets",
    headline: "Exporters adapt as global markets continue to shift",
    standfirst:
      "Swedish businesses are balancing new opportunities with a more complex trading environment.",
    body:
      "Companies with international reach are adjusting supply chains, exploring new markets and investing in resilience. Their experience highlights the importance of predictable rules and strong trading relationships.",
    publishedAt: "2025-11-04T14:15:00+01:00",
    sections: ["Economy", "Trade"],
    minutesToRead: 5,
  },
  {
    id: "cue-article-003",
    slug: "small-businesses-and-digital-transition",
    headline: "Small businesses make practical progress on digitalisation",
    standfirst:
      "Incremental investments are helping smaller firms improve productivity and customer service.",
    body:
      "Digital transformation does not always begin with a large programme. Many smaller companies are starting with focused changes to everyday processes, then building on what works for their teams and customers.",
    publishedAt: "2025-10-30T08:00:00+01:00",
    sections: ["Business", "Technology"],
    minutesToRead: 3,
  },
];

export class CueMockAdapter implements ContentAdapter {
  async getArticles(): Promise<NormalizedArticle[]> {
    return MOCK_ARTICLES.map((article) => {
      const date = new Date(article.publishedAt);

      if (Number.isNaN(date.getTime())) {
        throw new Error(`CUE mock article "${article.id}" has an invalid date.`);
      }

      return {
        id: article.id,
        slug: article.slug,
        title: article.headline,
        subtitle: article.standfirst,
        excerpt: article.standfirst,
        contentHtml: `<p>${escapeHtml(article.body)}</p>`,
        publishedAt: date.toISOString(),
        canonicalUrl: `https://cue-mock.invalid/articles/${article.slug}`,
        featuredImageUrl: null,
        categories: article.sections.map((name) => ({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        })),
        readingTimeMinutes: article.minutesToRead,
        source: "cue",
      };
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
