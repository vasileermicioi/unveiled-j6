import { createRoute } from "honox/factory";

import { Logo } from "../../components/Logo";
import { getCopy } from "../../lib/copy";
import type { Locale } from "../../lib/locale";
import { isValidLocale, localizedPath } from "../../lib/locale";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const copy = getCopy(locale);

  return c.render(
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:px-6 lg:px-8">
      <Logo className="text-5xl md:text-7xl" tone="black" />
      <a
        className="button--primary inline-flex items-center border-2 border-brand-dark bg-accent px-6 py-3 font-semibold text-foreground uppercase"
        href={localizedPath(locale, "discover")}
      >
        {copy.homeCta}
      </a>
    </div>,
    {
      locale,
      title: "Unveiled Berlin",
    },
  );
});
