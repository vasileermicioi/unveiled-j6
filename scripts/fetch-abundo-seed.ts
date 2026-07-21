/**
 * Refresh Abundo Berlin demo fixture + local seed images.
 *
 * Usage: bun scripts/fetch-abundo-seed.ts
 *
 * Writes:
 * - packages/db/src/catalog/fixtures/abundo-berlin-demo.json
 * - public/images/seed/partners/*.jpg
 * - public/images/seed/events/*.jpg
 *
 * Dates use relative daysFromToday/hour/minute (resolved at seed time).
 * Partner logos prefer Wikimedia Commons / Wikipedia venue photos (not event posters).
 */

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { bufferToPrebuiltVariants } from "../packages/images/src/offline/index.ts";
import { validateImageBuffer } from "../packages/images/src/validation.ts";

const BERLIN_CITY_ID = "01704393-9f68-70bf-8050-f527682ed3d0";
const API = "https://abundolive.de/api/v1";
const CDN = "https://cdn.abundolive.se/download";
const WIKI_UA = "UnveiledBerlinSeedBot/1.0 (demo seed; support@unveiled.berlin)";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = join(ROOT, "packages/db/src/catalog/fixtures/abundo-berlin-demo.json");
const SEED_IMAGES_DIR = join(ROOT, "public/images/seed");

const TARGET_EVENT_COUNT = 18;
const SELECT_POOL = 40;

/** Keep sexual-content titles out of the public demo catalog. */
function isExcludedDemoEvent(slug: string, title: string): boolean {
  return `${slug} ${title}`.toLowerCase().includes("sex");
}

const GENRE_TO_CATEGORY: Record<string, string> = {
  Theater: "Theater",
  Theatre: "Theater",
  Play: "Theater",
  Oper: "Theater",
  Opera: "Theater",
  Musical: "Theater",
  Musiktheater: "Theater",
  Improvisationstheater: "Theater",
  Show: "Theater",
  Varieté: "Theater",
  Circus: "Theater",
  Zirkus: "Theater",
  Kino: "Kino",
  Cinema: "Kino",
  Film: "Kino",
  Movie: "Kino",
  Ausstellung: "Ausstellung",
  Exhibition: "Ausstellung",
  Museum: "Museum",
  Konzert: "Konzert",
  Concert: "Konzert",
  "Klassische Musik": "Konzert",
  "Classical Music": "Konzert",
  Jazz: "Konzert",
  Comedy: "Comedy",
  "Stand Up": "Comedy",
  Kabarett: "Comedy",
  Tanz: "Tanz/Performance",
  Dance: "Tanz/Performance",
  Performance: "Tanz/Performance",
  Talk: "Talk/Lesung",
  Talkshow: "Talk/Lesung",
  Lesung: "Talk/Lesung",
  Reading: "Talk/Lesung",
  "Live Podcast": "Talk/Lesung",
  "Poetry Slam": "Talk/Lesung",
};

const CATEGORY_EVENT_TYPE: Record<string, string> = {
  Theater: "Performance",
  Kino: "Screening",
  Museum: "Other",
  Ausstellung: "Other",
  Konzert: "Concert",
  "Talk/Lesung": "Talk",
  Comedy: "Performance",
  "Tanz/Performance": "Performance",
};

/** Extra Commons/Wikipedia search queries for venues with weak default hits. */
const PARTNER_LOGO_QUERIES: Record<string, string[]> = {
  gretchen: ["Club Gretchen Berlin", "Gretchen club Berlin exterior"],
  philharmonie_berlin: ["Berliner Philharmonie", "Berlin Philharmonie exterior"],
  berliner_philharmonie: ["Berliner Philharmonie exterior", "Philharmonie Berlin ako"],
  grips_theater: ["Grips-Theater Berlin", "Grips Theater Hansaplatz"],
  hackesche_höfe_kino: ["Hackesche Höfe Kino Berlin", "Kino in den Hackeschen Höfen"],
  lido: ["Lido Nightclub Berlin Kreuzberg", "Lido Berlin exterior Cuvrystraße"],
  sophiensaele: ["Sophiensaele Berlin", "Fassade Sophiensaele"],
  freiluftkino_hasenheide: ["Freiluftkino Hasenheide", "Volkspark Hasenheide Freiluftkino"],
  berliner_kriminal_theater: ["Kriminaltheater Berlin Palisadenstraße", "Umspannwerk Ost Berlin"],
  fotografiska_berlin: ["Fotografiska Berlin", "Exterior of Fotografiska Berlin"],
  daadgalerie: ["daadgalerie Berlin", "DAAD gallery Berlin Oranienstraße"],
  pfefferberg_theater: ["Pfefferberg Berlin", "Atelierhaus Pfefferberg"],
  neue_zukunft: ["Neue Zukunft Berlin club", "Neue Zukunft Weissensee"],
  huxleys_neue_welt: ["Huxleys Neue Welt Berlin", "Huxleys Berlin"],
  luftschloss_tempelhofer_feld: ["Tempelhofer Feld Berlin", "Tempelhof field Berlin"],
  lark: ["LARK Berlin theater", "LARK theatre Berlin"],
  neue_bühne_friedrichshain: ["Neue Bühne Friedrichshain", "theatre pool Berlin Boxhagener"],
  theatre_pool: ["theatre pool Berlin", "Boxhagener Strasse theater Berlin"],
};

/**
 * Hand-picked Wikimedia facade / iconic venue photos (verified seedable).
 * Tried before search so we prefer place identity over event posters.
 */
const PARTNER_LOGO_URLS: Record<string, string[]> = {
  hackesche_höfe_kino: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Kino_in_den_Hackeschen_H%C3%B6fen.jpg/1280px-Kino_in_den_Hackeschen_H%C3%B6fen.jpg",
  ],
  fotografiska_berlin: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Exterior_of_Fotografiska_Berlin.jpg/1280px-Exterior_of_Fotografiska_Berlin.jpg",
  ],
  sophiensaele: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/FassadeSophiensaele.jpg/1280px-FassadeSophiensaele.jpg",
  ],
  lido: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Lido_in_Berlin-Kreuzberg.jpg/1280px-Lido_in_Berlin-Kreuzberg.jpg",
  ],
  freiluftkino_hasenheide: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Location_Berlinale_2021_%E2%80%93_Freiluftkino_Hasenheide_Juni_2021_E.jpg/1280px-Location_Berlinale_2021_%E2%80%93_Freiluftkino_Hasenheide_Juni_2021_E.jpg",
  ],
  grips_theater: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Grips-theater.berlin-hansaplatz.JPG/1280px-Grips-theater.berlin-hansaplatz.JPG",
  ],
  berliner_philharmonie: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Philharmonie%2C_Berlin%2C_170518%2C_ako.jpg/1280px-Philharmonie%2C_Berlin%2C_170518%2C_ako.jpg",
  ],
  philharmonie_berlin: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Philharmonie%2C_Berlin%2C_170518%2C_ako.jpg/1280px-Philharmonie%2C_Berlin%2C_170518%2C_ako.jpg",
  ],
  pfefferberg_theater: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Berlin-Mitte%2C_Prenzlauer_Berg%2C_Christinenstra%C3%9Fe_19%E2%80%9319a%2C_Atelierhaus_Pfefferberg_3.jpg/1280px-Berlin-Mitte%2C_Prenzlauer_Berg%2C_Christinenstra%C3%9Fe_19%E2%80%9319a%2C_Atelierhaus_Pfefferberg_3.jpg",
  ],
  berliner_kriminal_theater: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Umspannwerk_Ost_%28Berlin-Friedrichshain_2011%29_1155-1035-%28120%29.jpg/1280px-Umspannwerk_Ost_%28Berlin-Friedrichshain_2011%29_1155-1035-%28120%29.jpg",
  ],
  luftschloss_tempelhofer_feld: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Berlin_Spring_2012_Tempelhofer_Feld.jpg/1280px-Berlin_Spring_2012_Tempelhofer_Feld.jpg",
  ],
};

type Localized = { de?: string; en?: string; sv?: string };

type ListEvent = {
  id: string;
  name: Localized;
  slug: string;
  venue_id: string;
  venue_name: string;
  event_tag_ids: string[];
  picture_id?: string | null;
  rating_score?: number;
  popularity?: number;
};

type EventDetail = {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  event_tag_ids: string[];
  picture_ids?: string[];
  venue: {
    id: string;
    name: string;
    slug: string;
    address: string;
    location: { lat: number; lng: number };
  };
};

type Tag = { id: string; is_genre?: boolean; name: Localized };

type FixturePartner = {
  key: string;
  name: string;
  address: string;
  contactEmail: string;
  logoPath: string;
  logoSourceUrl: string;
  lat: string;
  lng: string;
};

type FixtureEvent = {
  slug: string;
  partnerKey: string;
  title: string;
  description: string;
  address: string;
  neighborhood: string;
  category: string;
  eventType: string;
  tags: string[];
  imagePath: string;
  imageSourceUrl: string;
  creditPrice: number;
  secretCode: string;
  languages: string[];
  barrierFree: boolean;
  lat: string;
  lng: string;
  daysFromToday: number;
  hour: number;
  minute: number;
  seedRole?: string;
  totalCapacity?: number;
  soldOut?: boolean;
  sourceUrl: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function abundoGet<T>(path: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(`${API}/${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function pickLocale(value: Localized | string | undefined, lang: "de" | "en" = "de"): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return (value[lang] || value.en || value.de || value.sv || "").trim();
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function neighborhoodFromAddress(address: string): string {
  const m = address.match(/\b(1\d{4})\b/);
  const plz = m?.[1] ?? "";
  const prefix = plz.slice(0, 3);
  if (["101", "105"].includes(prefix)) return "Mitte";
  if (["102"].includes(prefix)) return "F-Hain";
  if (["104"].includes(prefix)) return "P-Berg";
  if (["106", "107"].includes(prefix)) return "Charlottenburg";
  if (["109", "120", "123"].includes(prefix)) return "X-Berg";
  if (["133", "134"].includes(prefix)) return "Wedding";
  if (plz.startsWith("108")) return "Schöneberg";
  if (plz.startsWith("12")) return "X-Berg";
  return "Mitte";
}

function secretCodeFromSlug(slug: string): string {
  const base = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  return `${base || "ABUNDO"}26`;
}

function mapCategory(tagIds: string[], tagsById: Map<string, Tag>): string {
  for (const id of tagIds) {
    const tag = tagsById.get(id);
    if (!tag?.is_genre) continue;
    const de = pickLocale(tag.name, "de");
    const en = pickLocale(tag.name, "en");
    const mapped = GENRE_TO_CATEGORY[de] || GENRE_TO_CATEGORY[en];
    if (mapped) return mapped;
  }
  return "Theater";
}

function mapTags(tagIds: string[], tagsById: Map<string, Tag>): string[] {
  const out: string[] = [];
  for (const id of tagIds) {
    const tag = tagsById.get(id);
    if (!tag) continue;
    const label = pickLocale(tag.name, "de") || pickLocale(tag.name, "en");
    if (label && !out.includes(label)) out.push(label);
  }
  return out.slice(0, 6);
}

function safeFileStem(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "image"
  );
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": WIKI_UA },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Validate + normalize to a seedable JPEG (original variant via offline Pica). */
async function toSeedJpeg(buffer: Buffer): Promise<Buffer | null> {
  try {
    await validateImageBuffer(buffer);
    const prebuilt = await bufferToPrebuiltVariants(buffer, { source: "UPLOAD" });
    return prebuilt.variants["original.jpg"];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`  skip image: ${message.split("\n")[0]}`);
    return null;
  }
}

async function downloadSeedableJpeg(url: string): Promise<Buffer | null> {
  const raw = await fetchBuffer(url);
  if (!raw) return null;
  return toSeedJpeg(raw);
}

async function writeSeedImage(relativePath: string, jpeg: Buffer): Promise<string> {
  const abs = join(SEED_IMAGES_DIR, relativePath);
  await mkdir(dirname(abs), { recursive: true });
  await Bun.write(abs, jpeg);
  return relativePath;
}

async function resolveAbundoEventJpeg(pictureIds: string[]): Promise<{
  jpeg: Buffer;
  sourceUrl: string;
} | null> {
  const seen = new Set<string>();
  for (const id of pictureIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const sourceUrl = `${CDN}/${id}`;
    const jpeg = await downloadSeedableJpeg(sourceUrl);
    if (jpeg) return { jpeg, sourceUrl };
  }
  return null;
}

function venueNameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !["berlin", "club", "the", "and", "bar"].includes(t));
}

function isPlausibleVenuePhoto(
  url: string,
  title: string,
  partnerKey: string,
  partnerName: string,
): boolean {
  const hay = `${url} ${title}`.toLowerCase();
  if (hay.includes(".pdf") || hay.includes("logo.svg")) return false;

  // Hard rejects for known false positives
  if (
    partnerKey === "lido" &&
    (hay.includes("sète") || hay.includes("sete") || hay.includes("thau"))
  ) {
    return false;
  }
  if (
    partnerKey === "lark" &&
    (hay.includes("horned") || hay.includes("bird") || hay.includes("lark,"))
  ) {
    return false;
  }
  if (
    partnerKey === "neue_zukunft" &&
    (hay.includes("wer kann die neue zukunft") || hay.includes("reichskanzlei"))
  ) {
    return false;
  }

  const tokens = venueNameTokens(partnerName);
  const keyBits = partnerKey.split("_").filter((t) => t.length >= 3 && t !== "berlin");
  const hints = [...new Set([...tokens, ...keyBits])];
  const tokenHits = hints.filter((t) => hay.includes(t)).length;
  const hasBerlin = hay.includes("berlin");

  // Accept: Berlin + at least one venue token, OR two strong venue tokens (curated building names).
  if (hasBerlin && tokenHits >= 1) return true;
  if (tokenHits >= 2) return true;
  // Special-case short venue keys that are unique place names
  if (
    hasBerlin &&
    (hay.includes(partnerKey.replace(/_/g, " ")) || hay.includes(partnerKey.replace(/_/g, "-")))
  ) {
    return true;
  }
  return false;
}

async function commonsCandidateUrls(
  query: string,
  partnerKey: string,
  partnerName: string,
): Promise<string[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=12` +
    `&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1280&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": WIKI_UA } });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{
            url?: string;
            thumburl?: string;
            width?: number;
            height?: number;
            mime?: string;
          }>;
        }
      >;
    };
  };
  const pages = Object.values(data.query?.pages ?? {});
  const scored = pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      const mime = info?.mime ?? "";
      if (!mime.startsWith("image/")) return null;
      const w = info?.width ?? 0;
      const h = info?.height ?? 0;
      if (w < 800 || h < 420) return null;
      const title = page.title ?? "";
      const candidateUrl = info?.thumburl || info?.url || "";
      if (!candidateUrl) return null;
      if (!isPlausibleVenuePhoto(candidateUrl, title, partnerKey, partnerName)) return null;
      return {
        url: candidateUrl,
        title: title.toLowerCase(),
        area: w * h,
      };
    })
    .filter((x): x is { url: string; title: string; area: number } => Boolean(x?.url))
    .sort((a, b) => b.area - a.area);
  return scored.map((s) => s.url);
}

async function wikipediaCandidateUrls(query: string): Promise<string[]> {
  const searchUrl =
    `https://en.wikipedia.org/w/api.php?action=query&list=search` +
    `&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*`;
  const res = await fetch(searchUrl, { headers: { "User-Agent": WIKI_UA } });
  if (!res.ok) return [];
  const data = (await res.json()) as { query?: { search?: Array<{ title: string }> } };
  const titles = data.query?.search?.map((s) => s.title) ?? [];
  const urls: string[] = [];
  for (const title of titles) {
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { "User-Agent": WIKI_UA } },
    );
    if (!summaryRes.ok) continue;
    const summary = (await summaryRes.json()) as {
      title?: string;
      description?: string;
      extract?: string;
      originalimage?: { source?: string };
      thumbnail?: { source?: string };
    };
    const blob =
      `${summary.title ?? ""} ${summary.description ?? ""} ${summary.extract ?? ""}`.toLowerCase();
    if (!blob.includes("berlin")) continue;
    const image = summary.originalimage?.source || summary.thumbnail?.source;
    if (image) urls.push(image);
  }
  return urls;
}

async function resolvePartnerLogoJpeg(
  partnerKey: string,
  partnerName: string,
): Promise<{ jpeg: Buffer; sourceUrl: string } | null> {
  const tried = new Set<string>();

  for (const url of PARTNER_LOGO_URLS[partnerKey] ?? []) {
    if (tried.has(url)) continue;
    tried.add(url);
    const jpeg = await downloadSeedableJpeg(url);
    if (jpeg) {
      console.log(`  partner logo ${partnerKey}: ${url}`);
      return { jpeg, sourceUrl: url };
    }
  }

  const queries = [
    ...(PARTNER_LOGO_QUERIES[partnerKey] ?? []),
    `${partnerName} Berlin`,
    partnerName,
  ];
  const tokens = venueNameTokens(partnerName);

  for (const query of queries) {
    const candidates = [
      ...(await commonsCandidateUrls(query, partnerKey, partnerName)),
      ...(await wikipediaCandidateUrls(query)),
    ].filter((url) => isPlausibleVenuePhoto(url, url, partnerKey, partnerName));
    // Prefer titles/URLs that mention venue tokens.
    candidates.sort((a, b) => {
      const score = (u: string) =>
        tokens.reduce((n, t) => n + (u.toLowerCase().includes(t) ? 1 : 0), 0);
      return score(b) - score(a);
    });
    for (const url of candidates) {
      if (tried.has(url)) continue;
      tried.add(url);
      const jpeg = await downloadSeedableJpeg(url);
      if (jpeg) {
        console.log(`  partner logo ${partnerKey}: ${url}`);
        return { jpeg, sourceUrl: url };
      }
    }
    await sleep(150);
  }
  return null;
}

const FUTURE_DAY_OFFSETS = [3, 5, 7, 8, 10, 11, 12, 14, 15, 17, 18, 21, 23, 25, 28, 30, 32, 35];

async function main() {
  await mkdir(join(SEED_IMAGES_DIR, "partners"), { recursive: true });
  await mkdir(join(SEED_IMAGES_DIR, "events"), { recursive: true });

  const homeHtml = await (await fetch("https://abundolive.de/past")).text();
  const installId = /ab_install_id="([^"]+)"/.exec(homeHtml)?.[1];
  const clientVersion = /name="client-version" content="([^"]+)"/.exec(homeHtml)?.[1];
  const tagsJson = /var ab_event_tags=(\[.*?\]); var ab_install_id/.exec(homeHtml)?.[1];
  if (!installId || !clientVersion || !tagsJson) {
    throw new Error("Could not parse Abundo bootstrap (install id / version / tags)");
  }

  const headers = {
    Accept: "application/json",
    "User-Agent": "UnveiledBerlinSeedBot/1.0",
    "X-Abundo-Install": installId,
    "X-Abundo-Client": `home/${clientVersion}`,
  };

  const tags = JSON.parse(tagsJson) as Tag[];
  const tagsById = new Map(tags.map((t) => [t.id, t]));

  const listed = await abundoGet<ListEvent[]>(
    `c/events/home_list_view/past/${BERLIN_CITY_ID}/90`,
    headers,
  );
  console.log(`Listed ${listed.length} Berlin past events (90d)`);

  const ranked = [...listed]
    .filter((e) => {
      if (!e.picture_id) return false;
      const title = pickLocale(e.name);
      if (!title) return false;
      if (isExcludedDemoEvent(e.slug, title)) {
        console.log(`Exclude sensitive: ${e.slug}`);
        return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        (b.rating_score ?? 0) - (a.rating_score ?? 0) || (b.popularity ?? 0) - (a.popularity ?? 0),
    );

  const selected: ListEvent[] = [];
  const selectedIds = new Set<string>();
  const venuesUsed = new Set<string>();

  const requiredCategories = [
    "Theater",
    "Kino",
    "Ausstellung",
    "Konzert",
    "Comedy",
    "Tanz/Performance",
    "Talk/Lesung",
  ];

  for (const want of requiredCategories) {
    const hit = ranked.find(
      (e) => !selectedIds.has(e.id) && mapCategory(e.event_tag_ids, tagsById) === want,
    );
    if (!hit) continue;
    selected.push(hit);
    selectedIds.add(hit.id);
    venuesUsed.add(hit.venue_id);
  }

  for (const ev of ranked) {
    if (selected.length >= SELECT_POOL) break;
    if (selectedIds.has(ev.id) || venuesUsed.has(ev.venue_id)) continue;
    selected.push(ev);
    selectedIds.add(ev.id);
    venuesUsed.add(ev.venue_id);
  }

  for (const ev of ranked) {
    if (selected.length >= SELECT_POOL) break;
    if (selectedIds.has(ev.id)) continue;
    selected.push(ev);
    selectedIds.add(ev.id);
  }

  console.log(
    `Fetching details for up to ${selected.length} candidates (target ${TARGET_EVENT_COUNT})…`,
  );

  const partnersByKey = new Map<string, FixturePartner>();
  const events: FixtureEvent[] = [];

  for (const listEv of selected) {
    await sleep(200);
    let detail: EventDetail;
    try {
      detail = await abundoGet<EventDetail>(
        `c/event/home_view/by_slug/${BERLIN_CITY_ID}/${encodeURIComponent(listEv.slug)}`,
        headers,
      );
    } catch (err) {
      console.warn(`Skip ${listEv.slug}:`, err);
      continue;
    }

    const title = pickLocale(detail.name, "de") || pickLocale(detail.name, "en");
    if (!title) continue;
    if (isExcludedDemoEvent(detail.slug, title)) {
      console.log(`Skip excluded: ${detail.slug}`);
      continue;
    }

    const descriptionRaw =
      pickLocale(detail.description, "de") || pickLocale(detail.description, "en");
    const description =
      stripMarkdown(descriptionRaw).slice(0, 2000) ||
      `${title} at ${detail.venue.name} — curated Berlin cultural event (demo seed from Abundo).`;

    const pictureIds = [
      ...(detail.picture_ids ?? []),
      ...(listEv.picture_id ? [listEv.picture_id] : []),
    ];
    const eventImage = await resolveAbundoEventJpeg(pictureIds);
    if (!eventImage) {
      console.warn(`Skip ${listEv.slug}: no seedable event image`);
      continue;
    }

    const partnerKey = detail.venue.slug || detail.venue.id;
    const address = detail.venue.address || `${detail.venue.name}, Berlin`;
    // Abundo may return literal 0,0 — `??` does not catch that (0 is defined).
    const rawLat = detail.venue.location?.lat;
    const rawLng = detail.venue.location?.lng;
    const hasCoords =
      typeof rawLat === "number" &&
      typeof rawLng === "number" &&
      Number.isFinite(rawLat) &&
      Number.isFinite(rawLng) &&
      !(Math.abs(rawLat) < 0.01 && Math.abs(rawLng) < 0.01);
    const lat = String(hasCoords ? rawLat : 52.52);
    const lng = String(hasCoords ? rawLng : 13.4);

    const eventRel = `events/${safeFileStem(detail.slug)}.jpg`;
    await writeSeedImage(eventRel, eventImage.jpeg);

    if (!partnersByKey.has(partnerKey)) {
      const logo = await resolvePartnerLogoJpeg(partnerKey, detail.venue.name);
      if (!logo) {
        console.warn(
          `  partner ${partnerKey}: no iconic venue image — using event image as temporary logo`,
        );
      }
      const logoJpeg = logo?.jpeg ?? eventImage.jpeg;
      const logoSourceUrl = logo?.sourceUrl ?? eventImage.sourceUrl;
      const logoRel = `partners/${safeFileStem(partnerKey)}.jpg`;
      await writeSeedImage(logoRel, logoJpeg);
      partnersByKey.set(partnerKey, {
        key: partnerKey,
        name: detail.venue.name,
        address,
        contactEmail: `demo+${partnerKey.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}@unveiled.berlin`,
        logoPath: logoRel,
        logoSourceUrl,
        lat,
        lng,
      });
    }

    const category = mapCategory(detail.event_tag_ids, tagsById);
    const eventType = CATEGORY_EVENT_TYPE[category] ?? "Other";

    events.push({
      slug: detail.slug,
      partnerKey,
      title,
      description,
      address,
      neighborhood: neighborhoodFromAddress(address),
      category,
      eventType,
      tags: mapTags(detail.event_tag_ids, tagsById),
      imagePath: eventRel,
      imageSourceUrl: eventImage.sourceUrl,
      creditPrice: category === "Ausstellung" || category === "Museum" ? 1 : 2,
      secretCode: secretCodeFromSlug(detail.slug),
      languages: ["de", "en"],
      barrierFree: false,
      lat,
      lng,
      daysFromToday: FUTURE_DAY_OFFSETS[events.length % FUTURE_DAY_OFFSETS.length] ?? 7,
      hour: 19,
      minute: 30,
      sourceUrl: `https://abundolive.de/event/berlin/${detail.slug}`,
    });

    if (events.length >= TARGET_EVENT_COUNT) break;
  }

  if (events.length < 6) {
    throw new Error(`Too few events fetched (${events.length}); aborting write`);
  }

  const byCategory = (cat: string) => events.find((e) => e.category === cat && !e.seedRole);

  const tonight =
    byCategory("Theater") || byCategory("Konzert") || byCategory("Tanz/Performance") || events[0];
  if (!tonight) throw new Error("No events available to assign tonight role");
  tonight.seedRole = "tonight";
  tonight.daysFromToday = 0;
  tonight.hour = 22;
  tonight.minute = 0;
  tonight.title = `Tonight: ${tonight.title.replace(/^Tonight:\s*/i, "")}`;

  const past =
    events.find((e) => e !== tonight && e.category === "Theater") ||
    events.find((e) => e !== tonight) ||
    tonight;
  if (past !== tonight) {
    past.seedRole = "pastHidden";
    past.daysFromToday = -5;
    past.hour = 20;
    past.minute = 0;
    past.title = `Past Premiere: ${past.title.replace(/^Past Premiere:\s*/i, "")}`;
  }

  const theaterFuture =
    events.find((e) => !e.seedRole && e.category === "Theater") || events.find((e) => !e.seedRole);
  if (!theaterFuture) throw new Error("No events available to assign theaterFuture role");
  theaterFuture.seedRole = "theaterFuture";
  theaterFuture.daysFromToday = 8;
  theaterFuture.hour = 19;
  theaterFuture.minute = 30;

  const ausstellung =
    events.find((e) => !e.seedRole && e.category === "Ausstellung") ||
    events.find((e) => !e.seedRole && e.category === "Museum");
  if (ausstellung) {
    ausstellung.seedRole = "ausstellung";
    ausstellung.daysFromToday = 14;
    ausstellung.hour = 18;
    ausstellung.minute = 0;
  }

  const konzert = events.find((e) => !e.seedRole && e.category === "Konzert");
  if (konzert) {
    konzert.seedRole = "konzert";
    konzert.daysFromToday = 17;
    konzert.hour = 20;
    konzert.minute = 30;
  }

  const soldOut =
    events.find((e) => !e.seedRole && e.partnerKey === tonight.partnerKey) ||
    events.find((e) => !e.seedRole && e.category === "Theater") ||
    events.find((e) => !e.seedRole);
  if (soldOut) {
    soldOut.seedRole = "soldOutWaitlist";
    soldOut.slug = "waitlist_demo_night";
    soldOut.daysFromToday = 12;
    soldOut.hour = 20;
    soldOut.minute = 0;
    soldOut.totalCapacity = 20;
    soldOut.soldOut = true;
    soldOut.title = "Sold Out: Waitlist Demo Night";
    soldOut.description =
      "Seed sold-out event for waitlist demos — join waitlist, then raise capacity in admin edit to auto-promote.";
    soldOut.secretCode = "WAITLIST26";
    soldOut.partnerKey = tonight.partnerKey;
    soldOut.address = tonight.address;
    soldOut.neighborhood = tonight.neighborhood;
    soldOut.lat = tonight.lat;
    soldOut.lng = tonight.lng;
    soldOut.imagePath = tonight.imagePath;
    soldOut.imageSourceUrl = tonight.imageSourceUrl;
    soldOut.category = "Theater";
    soldOut.eventType = "Performance";
    soldOut.tags = ["waitlist", "sold-out", "demo"];
    soldOut.sourceUrl = "https://abundolive.de/event/berlin/waitlist_demo_night";
  }

  const usedPartnerKeys = new Set(events.map((e) => e.partnerKey));
  const partners = [...partnersByKey.values()].filter((p) => usedPartnerKeys.has(p.key));

  const fixture = {
    source: "https://abundolive.de/past",
    city: "Berlin",
    cityId: BERLIN_CITY_ID,
    fetchedAt: new Date().toISOString(),
    imagesRoot: "public/images/seed",
    note: "Local JPEGs under public/images/seed. Dates use daysFromToday/hour/minute at seed time. Partner logos from Wikimedia when available.",
    partners,
    events,
  };

  await Bun.write(OUT_JSON, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`Wrote ${events.length} events / ${partners.length} partners → ${OUT_JSON}`);
  console.log(`Images → ${SEED_IMAGES_DIR}`);
  for (const role of [
    "tonight",
    "pastHidden",
    "theaterFuture",
    "ausstellung",
    "konzert",
    "soldOutWaitlist",
  ]) {
    const hit = events.find((e) => e.seedRole === role);
    console.log(`  role ${role}: ${hit?.title ?? "(missing)"}`);
  }
  console.log("Bake Workers-safe variant packs: bun scripts/bake-seed-image-variants.ts");
}

await main();
