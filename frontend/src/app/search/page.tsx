import { Metadata } from "next";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";

interface Post {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  published_at: string;
  snippet: string; // server-rendered highlight HTML — sanitized before use
}

interface SearchApiResponse {
  data: Post[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

// SEO: Validate Search pages noindex
export const metadata: Metadata = {
  title: "Search Results | The Corporate Blog",
  robots: { index: false, follow: true }, // 🛑 NoIndex for SEO compliance
};

async function fetchSearchResults(query: string): Promise<Post[]> {
  if (!query) return [];

  try {
    const url = `${BASE_URL}/api/posts/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`[Search] API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data: SearchApiResponse = await res.json();
    return data.data ?? [];
  } catch (err) {
    console.error("[Search] Failed to fetch search results:", err);
    return [];
  }
}

function sanitizeSnippet(raw: string): string {
  return raw
    .replace(/<(?!\/?mark\b)[^>]*>/gi, "") // strip all tags except <mark> / </mark>
    .trim();
}

function buildJsonLd(query: string, posts: Post[]) {
  return {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: `Search results for "${query}"`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const results = await fetchSearchResults(query);
  const jsonLd = buildJsonLd(query, results);

  return (
    <>
      {/* JSON-LD must live outside block-level containers for valid HTML */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Search Blog</h1>

        <SearchBar />

        {query && (
          <section aria-label="Search results" className="mt-8">
            <h2 className="text-xl mb-4">
              Results for <span className="font-semibold">"{query}"</span>
            </h2>

            {results.length === 0 ? (
              <p className="text-gray-500">
                No posts found. Try different keywords.
              </p>
            ) : (
              <ul className="grid gap-6 list-none p-0">
                {results.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block border p-4 rounded-lg hover:shadow-lg transition"
                    >
                      <h3 className="text-xl font-semibold text-blue-600">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        By {post.author_name} &bull;{" "}
                        <time dateTime={post.published_at}>
                          {new Date(post.published_at).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </time>
                      </p>
                      <p
                        className="text-sm text-gray-700 mt-2"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeSnippet(post.snippet),
                        }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </>
  );
}
