export type Locale = "de" | "en";

export const LOCALES: Locale[] = ["de", "en"];
export const DEFAULT_LOCALE: Locale = "de";

export function isValidLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function parseAcceptLanguage(header: string | undefined): Locale {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  const languages = header
    .split(",")
    .map((part) => {
      const [rawLang, qPart] = part.trim().split(";");
      const lang = (rawLang ?? "").toLowerCase().split("-")[0] ?? "";
      const q = qPart?.startsWith("q=") ? Number.parseFloat(qPart.slice(2)) : 1;
      return { lang, q };
    })
    .filter(({ lang }) => lang.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { lang } of languages) {
    if (lang === "en") {
      return "en";
    }
    if (lang === "de") {
      return "de";
    }
  }

  return DEFAULT_LOCALE;
}

export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && isValidLocale(first)) {
    segments[0] = target;
    return `/${segments.join("/")}`;
  }

  return `/${target}`;
}

export function localizedPath(locale: Locale, segment: string): string {
  const clean = segment.replace(/^\//, "");
  if (!clean) {
    return `/${locale}`;
  }
  return `/${locale}/${clean}`;
}

export function isActiveNavPath(currentPath: string, navPath: string): boolean {
  const normalize = (path: string) => path.replace(/\/$/, "") || "/";
  return normalize(currentPath) === normalize(navPath);
}

export function parseLocaleFromPath(pathname: string): Locale | null {
  const first = pathname.split("/").filter(Boolean)[0];
  return first && isValidLocale(first) ? first : null;
}

type LocaleContext = {
  req: {
    param: (name: string) => string | undefined;
    url: string;
  };
};

export function getRequestLocale(c: LocaleContext): Locale {
  const fromParam = c.req.param("locale");
  if (fromParam && isValidLocale(fromParam)) {
    return fromParam;
  }

  return parseLocaleFromPath(new URL(c.req.url).pathname) ?? DEFAULT_LOCALE;
}

export function isLocaleRoot(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  return segments.length === 1 && Boolean(first && isValidLocale(first));
}

const AUTH_PATH_SEGMENTS = new Set(["login", "signup", "forgot-password", "reset-password"]);

export function isAuthPage(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  if (!maybeLocale || !isValidLocale(maybeLocale)) {
    return false;
  }

  const pageSegment = segments[1];
  return pageSegment !== undefined && AUTH_PATH_SEGMENTS.has(pageSegment);
}
