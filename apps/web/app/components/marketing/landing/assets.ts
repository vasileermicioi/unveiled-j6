export type LandingGalleryImage = {
  src: string;
  objectPosition?: string;
  contain?: boolean;
};

const img = (file: string) => `/images/landing/${file}`;

export const landingHeroImages: LandingGalleryImage[] = [
  { src: img("hero-01.jpg") },
  { src: img("hero-02.jpg"), objectPosition: "80% center" },
  { src: img("hero-03.jpg"), objectPosition: "15% center" },
  { src: img("hero-04.jpg") },
  { src: img("hero-05.jpg") },
  { src: img("hero-06.jpg") },
  { src: img("hero-07.jpg") },
];

export const landingEventImages: Record<string, LandingGalleryImage[]> = {
  chameleon: [{ src: img("events-01.jpg") }, { src: img("events-02.jpg") }],
  tempelhof: [{ src: img("events-03.jpg") }, { src: img("events-04.jpg"), contain: true }],
  "dark-matter": [{ src: img("events-05.jpg") }, { src: img("events-06.jpg") }],
  rooftop: [{ src: img("events-07.jpg") }],
  "gallery-hop": [{ src: img("events-08.jpg") }],
};

export const landingVenueImages = [img("flex-01.jpg"), img("flex-02.jpg")] as const;

export const landingCommunityImages = [
  img("community-01.jpg"),
  img("community-02.jpg"),
  img("community-03.jpg"),
  img("community-04.jpg"),
  img("community-05.jpg"),
  img("community-06.jpg"),
  img("community-07.jpg"),
  img("community-08.jpg"),
  img("community-09.jpg"),
  img("community-10.jpg"),
  img("community-11.jpg"),
] as const;
