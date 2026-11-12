import type { ContentAdapter } from "./content-adapter";
import { CueMockAdapter } from "./adapters/cue-mock-adapter";
import { WordPressAdapter } from "./adapters/wordpress-adapter";
import type { NormalizedArticle } from "./normalized-article";

export async function getUnifiedArticles(
  adapters: readonly ContentAdapter[] = [
    new WordPressAdapter(),
    new CueMockAdapter(),
  ],
): Promise<NormalizedArticle[]> {
  const articleGroups = await Promise.all(
    adapters.map((adapter) => adapter.getArticles()),
  );

  return articleGroups
    .flat()
    .sort(
      (first, second) =>
        Date.parse(second.publishedAt) - Date.parse(first.publishedAt) ||
        first.id.localeCompare(second.id),
    );
}
