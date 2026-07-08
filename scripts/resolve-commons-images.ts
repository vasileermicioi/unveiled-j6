/**
 * Resolve Wikimedia Commons image search queries to 1280px thumbnail URLs.
 *
 * Usage:
 *   bun scripts/resolve-commons-images.ts "Deutsches Theater Berlin building"
 *   bun scripts/resolve-commons-images.ts "Schaubühne Berlin" "Konzerthaus Berlin interior"
 *
 * Uses the Commons API (no crawling). Set a descriptive User-Agent per Wikimedia policy.
 * Pick CC-licensed or public-domain files; verify attribution before production use.
 */

const USER_AGENT = "UnveiledBerlinSeed/1.0 (demo seed; contact: support@unveiled.berlin)";

type CommonsImageResult = {
  title: string;
  width: number;
  height: number;
  thumbUrl: string;
  descriptionUrl: string;
};

async function searchCommonsImages(query: string, limit = 5): Promise<CommonsImageResult[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: "1280",
    format: "json",
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Commons API error (${response.status})`);
  }

  const data = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            thumbwidth?: number;
            thumbheight?: number;
            width?: number;
            height?: number;
            descriptionurl?: string;
          }>;
        }
      >;
    };
  };

  const pages = data.query?.pages ?? [];

  return Object.values(pages)
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl && !info?.url) {
        return null;
      }

      const width = info.thumbwidth ?? info.width ?? 0;
      const height = info.thumbheight ?? info.height ?? 0;
      const mime = info.mime ?? "";
      if (mime && !mime.startsWith("image/")) {
        return null;
      }
      if (width < 800 || height < 420) {
        return null;
      }

      return {
        title: page.title ?? "Unknown",
        width,
        height,
        thumbUrl: info.thumburl ?? info.url ?? "",
        descriptionUrl: info.descriptionurl ?? "",
      };
    })
    .filter((row): row is CommonsImageResult => row !== null);
}

const queries = process.argv.slice(2);

if (queries.length === 0) {
  console.error('Usage: bun scripts/resolve-commons-images.ts "<search query>" [...]');
  process.exit(1);
}

for (const query of queries) {
  console.log(`\n# ${query}`);
  const results = await searchCommonsImages(query);
  if (results.length === 0) {
    console.log("  (no suitable images ≥ 800×420)");
    continue;
  }

  for (const result of results) {
    console.log(`  ${result.title} — ${result.width}×${result.height}`);
    console.log(`  ${result.thumbUrl}`);
    console.log(`  ${result.descriptionUrl}`);
  }
}
