export type LandingGalleryImage = {
  src: string;
  objectPosition?: string;
  contain?: boolean;
};

const img = (file: string) => `/images/landing/${file}`;

export const landingV3HeroImages: LandingGalleryImage[] = [
  { src: img("hero-01.jpg") },
  { src: img("hero-02.jpg"), objectPosition: "80% center" },
  { src: img("hero-03.jpg"), objectPosition: "15% center" },
  { src: img("hero-04.jpg") },
  { src: img("hero-05.jpg") },
  { src: img("hero-06.jpg") },
  { src: img("hero-07.jpg") },
];

export const landingV3CommunityImages = [
  img("community-01.jpg"),
  img("community-02.jpg"),
  img("community-03.jpg"),
  img("community-04.jpg"),
  img("community-05.jpg"),
  img("community-06.jpg"),
  img("community-07.jpg"),
  img("community-08.jpg"),
] as const;
