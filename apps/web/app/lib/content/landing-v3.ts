import type { LandingLiveTeaser, LandingV3Content, LocalizedContent } from "./types";

const partnerLogo = (file: string) => `/images/landing/partners/${file}`;

const faviconLogo = (domain: string) =>
  `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

const v3Partners = [
  {
    name: "Designpanoptikum",
    href: "https://designpanoptikum.com/",
    logoSrc: faviconLogo("designpanoptikum.com"),
  },
  {
    name: "DDR Museum",
    href: "https://www.ddr-museum.de/",
    logoSrc: faviconLogo("ddr-museum.de"),
  },
  {
    name: "Theater im Delphi",
    href: "https://theater-im-delphi.de/",
    logoSrc: partnerLogo("theater-im-delphi.png"),
  },
  {
    name: "Hebbel am Ufer",
    href: "https://www.hebbel-am-ufer.de/",
    logoSrc: partnerLogo("hebbel-am-ufer.png"),
  },
  {
    name: "Dark Matter",
    href: "https://www.darkmatter.berlin/",
    logoSrc: partnerLogo("dark-matter.png"),
  },
  {
    name: "Fotografiska Berlin",
    href: "https://berlin.fotografiska.com/de",
    logoSrc: partnerLogo("fotografiska.png"),
  },
  {
    name: "Samurai Museum",
    href: "https://samuraimuseum.de/",
    logoSrc: partnerLogo("samurai-museum.png"),
  },
  {
    name: "Sophiensæle",
    href: "https://sophiensaele.com/de",
    logoSrc: partnerLogo("sophiensaele.png"),
  },
  {
    name: "Bröhan-Museum",
    href: "https://www.broehan-museum.de/",
    logoSrc: partnerLogo("broehan-museum.png"),
  },
  {
    name: "P61 Gallery",
    href: "https://www.p61gallery.com/",
    logoSrc: partnerLogo("p61-gallery.png"),
  },
] as const;

export const landingV3Content: LocalizedContent<LandingV3Content> = {
  de: {
    hero: {
      tag: "Willkommen im Culture Club.",
      headlineA: "Berliner Kultur",
      headlineB: "ist besser zusammen.",
      lead: "Entdecke Konzerte, Ausstellungen, Theater und versteckte Orte in ganz Berlin. Und triff Leute, mit denen du sie erlebst.",
      galleryAlt: "unveiled Community",
    },
    offer: {
      kind: "regular",
      price: "29 €",
      period: "pro Monat",
      basePerk: {
        highlight: "17",
        title: "Credits jeden Monat",
        body: "für Community Experiences & Besuche bei Kulturpartnern",
        highlightPlacement: "start",
      },
      perkGroupLabel: "Member Perks",
      foundingPerks: [
        {
          highlight: "+5",
          title: "extra Credits",
          body: "Mehr zum Entdecken in deinem ersten Monat",
          highlightPlacement: "start",
        },
        {
          highlight: "+1",
          title: "Bring deine",
          body: "zu ausgewählten Community Experiences",
          highlightPlacement: "end",
        },
      ],
      cta: "Werde Teil des unveiled Culture Clubs",
      cancel: "Jederzeit kündbar",
    },
    events: {
      eyebrow: "Als Nächstes",
      headline: "Also, was machen wir als Nächstes?",
      body: "Sieh, was ansteht, und finde deine Leute zum Mitkommen.",
      loginCta: "Einloggen für mehr",
      loginShort: "Einloggen",
      communityLabel: "unveiled Community Experience",
      previousPhoto: "Vorheriges Foto",
      nextPhoto: "Nächstes Foto",
    },
    credits: {
      eyebrow: "So funktioniert's",
      headlineA: "Deine Mitgliedschaft.",
      headlineB: "Deine Pläne.",
      body: "17 Credits jeden Monat, für unsere Community Experiences und unsere Kulturpartner.",
      goTogetherTitle: "Gemeinsam losziehen",
      goTogetherBody:
        "Komm zu unseren Community Experiences und triff Leute, mit denen du Berlin erlebst.",
      ownPlansTitle: "Mach deine eigenen Pläne",
      ownPlansBody:
        "Entdecke unsere Kulturpartner mit deinen Credits. Allein oder mit jemandem aus der Community.",
      partnersEyebrow: "Unsere Kulturpartner",
      partnersSub: "Ständig kommen neue Orte zu unveiled dazu.",
      partnersNote: "Verfügbarkeit der Partner und Experiences ändern sich regelmäßig.",
      partners: v3Partners,
    },
    community: {
      eyebrow: "Echte Leute",
      headline: "Komm für die Kultur. Bleib für die Leute.",
      proof: "Werde Teil von 500+ Leuten in unserer Community.",
      photoAlt: "unveiled Community",
    },
    finalCta: {
      headline: "Sehen wir uns beim nächsten Mal?",
      body: "Mehr Kultur · Mehr Pläne · Mehr Leute, mit denen du es erlebst",
      cta: "Werde Teil des unveiled Culture Clubs",
      cancel: "Jederzeit kündbar",
    },
  },
  en: {
    hero: {
      tag: "Welcome to the culture club.",
      headlineA: "Berlin culture",
      headlineB: "is better together.",
      lead: "Discover concerts, exhibitions, theatre and hidden places across Berlin. And meet people to experience them with.",
      galleryAlt: "unveiled community",
    },
    offer: {
      kind: "regular",
      price: "29 €",
      period: "per month",
      basePerk: {
        highlight: "17",
        title: "Credits every month",
        body: "to spend on Community Experiences & cultural partner visits",
        highlightPlacement: "start",
      },
      perkGroupLabel: "First member perks",
      foundingPerks: [
        {
          highlight: "+5",
          title: "extra Credits",
          body: "More to explore in your first month",
          highlightPlacement: "start",
        },
        {
          highlight: "+1",
          title: "Bring your",
          body: "to selected Community Experiences",
          highlightPlacement: "end",
        },
      ],
      cta: "Join the unveiled culture club",
      cancel: "Cancel anytime",
    },
    events: {
      eyebrow: "Up next",
      headline: "So, what are we doing next?",
      body: "See what's coming up and find your people to go with.",
      loginCta: "Log in to see more",
      loginShort: "Log in",
      communityLabel: "unveiled Community Experience",
      previousPhoto: "Previous photo",
      nextPhoto: "Next photo",
    },
    credits: {
      eyebrow: "How it works",
      headlineA: "Your membership.",
      headlineB: "Your plans.",
      body: "17 Credits every month, to spend across our Community Experiences and our cultural partners.",
      goTogetherTitle: "Go together",
      goTogetherBody: "Join our Community Experiences and meet people to experience Berlin with.",
      ownPlansTitle: "Make your own plans",
      ownPlansBody:
        "Explore our cultural partners with your Credits. Go solo or find someone from the community to join you.",
      partnersEyebrow: "Our cultural partners",
      partnersSub: "New places keep joining unveiled.",
      partnersNote: "Partner availability and experiences change regularly.",
      partners: v3Partners,
    },
    community: {
      eyebrow: "Real people",
      headline: "Come for the culture. Stay for the people.",
      proof: "Join 500+ people already in our community.",
      photoAlt: "unveiled community",
    },
    finalCta: {
      headline: "See you at the next one?",
      body: "More culture · More plans · More people to experience it with",
      cta: "Join the unveiled culture club",
      cancel: "Cancel anytime",
    },
  },
};

/**
 * Static fallback rail items (previous static rail copy minus credits) used
 * when the catalog query is empty or unreachable, so the locale-home build
 * stays green. Guest-safe: no credit prices, capacity, or event-detail URLs.
 */
export const landingFallbackTeasers: LocalizedContent<LandingLiveTeaser[]> = {
  de: [
    {
      id: "chameleon",
      title: "Show & Drinks im Chamäleon Theater",
      description:
        "Wir schauen die Show im Chamäleon Theater und gehen danach zusammen was trinken. Join the unveiled culture club.",
      dateLabel: "02 SEP",
      time: "20:00",
      place: "Mitte",
    },
    {
      id: "tempelhof",
      title: "Sunset & Festival am Tempelhofer Feld",
      description:
        "Musik, Talks und ein Sonnenuntergang auf einem echten Flugfeld. Wir verbringen den Freitagabend zusammen auf dem Tempelhofer Feld.",
      dateLabel: "04 SEP",
      time: "ab 19:00",
      place: "Tempelhofer Feld",
    },
    {
      id: "dark-matter",
      title: "Licht & Drinks im Dark Matter",
      description:
        "Durch die Lichtinstallationen laufen, Drink in der Hand, mit den Leuten die's feiern.",
      dateLabel: "09 SEP",
      time: "ab 19:00",
      place: "Lichtenberg",
    },
    {
      id: "rooftop",
      title: "Sunset Rooftop Cinema",
      description:
        "Open-Air-Film, warme Drinks, Decken und gute Gesellschaft, wenn es dunkel wird.",
      dateLabel: "18 SEP",
      time: "",
      place: "Neukölln",
    },
    {
      id: "gallery-hop",
      title: "Gallery Hop in Kreuzberg",
      description: "Drei Studios, ein Abend, eine kleine Gruppe. Kein Solo-Herumirren.",
      dateLabel: "25 SEP",
      time: "",
      place: "Kreuzberg",
    },
  ],
  en: [
    {
      id: "chameleon",
      title: "Show & Drinks at Chamäleon Theater",
      description:
        "We watch the show at Chamäleon Theater, then head out for drinks together. Join the unveiled culture club.",
      dateLabel: "02 SEP",
      time: "20:00",
      place: "Mitte",
    },
    {
      id: "tempelhof",
      title: "Sunset & Festival at Tempelhof Field",
      description:
        "Music, talks and a sunset on an actual airfield. We're spending Friday night at Tempelhofer Feld together.",
      dateLabel: "04 SEP",
      time: "from 19:00",
      place: "Tempelhofer Feld",
    },
    {
      id: "dark-matter",
      title: "Light & Drinks at Dark Matter",
      description:
        "Walk through the light installations, one drink in hand, with the people who get it.",
      dateLabel: "09 SEP",
      time: "from 19:00",
      place: "Lichtenberg",
    },
    {
      id: "rooftop",
      title: "Sunset Rooftop Cinema",
      description: "Open air film, warm drinks, blankets and good company as it gets dark.",
      dateLabel: "18 SEP",
      time: "",
      place: "Neukölln",
    },
    {
      id: "gallery-hop",
      title: "Gallery Hop in Kreuzberg",
      description: "Three studios, one evening, a small group. No awkward solo wandering.",
      dateLabel: "25 SEP",
      time: "",
      place: "Kreuzberg",
    },
  ],
};
