import type { NormalizedArticle } from "./normalized-article";

export interface ContentAdapter {
  getArticles(): Promise<NormalizedArticle[]>;
}
