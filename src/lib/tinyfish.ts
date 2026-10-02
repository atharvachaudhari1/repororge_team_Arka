import { TinyFish } from "@tiny-fish/sdk";

/**
 * TinyFish Web Automation & Search Client
 * Uses the user's TINYFISH_API_KEY from environment to perform real-time web intelligence.
 */

let cachedClient: TinyFish | null = null;

export function getTinyFishClient(): TinyFish | null {
  const apiKey =
    (typeof process !== "undefined" && process.env?.TINYFISH_API_KEY) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: { TINYFISH_API_KEY?: string } }).env
        ?.TINYFISH_API_KEY) ||
    null;

  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new TinyFish({ apiKey });
  }
  return cachedClient;
}

export type TinyFishJobResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

/**
 * Searches the live web for jobs in Mumbai matching accessibility and tech keywords.
 */
export async function searchMumbaiJobsWithTinyFish(query = "accessible jobs hiring Mumbai"): Promise<TinyFishJobResult[]> {
  try {
    const client = getTinyFishClient();
    if (!client) {
      console.warn("TinyFish API key not configured");
      return [];
    }

    const response = await client.search.query({
      query: `${query} BKC Andheri Powai`,
    });

    return (response.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet || "",
      source: r.site_name || "Web Search",
    }));
  } catch (err) {
    console.error("Failed to query TinyFish:", err);
    return [];
  }
}
