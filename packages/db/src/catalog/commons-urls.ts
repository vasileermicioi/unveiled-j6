/**
 * Direct Wikimedia Commons 1280px thumbnail URLs (verified fetchable).
 * Prefer these over Special:FilePath redirects for batch seeding.
 *
 * @see packages/db/src/catalog/seed-data.ts
 */

export const WIKIMEDIA_SEED_IMAGES = {
  volksbuehneFacade: {
    file: "Volksbühne, Berlin-Mitte, 150823, ako.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Volksb%C3%BChne%2C_Berlin-Mitte%2C_150823%2C_ako.jpg/1280px-Volksb%C3%BChne%2C_Berlin-Mitte%2C_150823%2C_ako.jpg",
  },
  volksbuehnePlatz: {
    file: "Berlin, Mitte, Rosa-Luxemburg-Platz, Volksbuehne 02.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Berlin%2C_Mitte%2C_Rosa-Luxemburg-Platz%2C_Volksbuehne_02.jpg/1280px-Berlin%2C_Mitte%2C_Rosa-Luxemburg-Platz%2C_Volksbuehne_02.jpg",
  },
  deutschesTheaterFacade: {
    file: "Deutsches Theater Berlin 2024-05-09 01.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Deutsches_Theater_Berlin_2024-05-09_01.jpg/1280px-Deutsches_Theater_Berlin_2024-05-09_01.jpg",
  },
  deutschesTheaterTartuffe: {
    file: 'Deutsches Theater Berlin - "Tartuffe" Lustspiel von Molière - Fotothek 0000151 006 - Restored version.jpg',
    url: "https://upload.wikimedia.org/wikipedia/commons/0/06/Deutsches_Theater_Berlin_-_%22Tartuffe%22_Lustspiel_von_Moli%C3%A8re_-_Fotothek_0000151_006_-_Restored_version.jpg",
  },
  schaubuehne: {
    file: "Berlin-Charlottenburg Schaubuehne 05-2014.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Berlin-Charlottenburg_Schaubuehne_05-2014.jpg/1280px-Berlin-Charlottenburg_Schaubuehne_05-2014.jpg",
  },
  gropiusBauFacade: {
    file: "Martin-Gropius-Bau_in_Berlin.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Martin-Gropius-Bau_in_Berlin.jpg/1280px-Martin-Gropius-Bau_in_Berlin.jpg",
  },
  gropiusBauWall: {
    file: "Martin_Gropius_Bau_01.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Martin_Gropius_Bau_01.jpg/1280px-Martin_Gropius_Bau_01.jpg",
  },
  hkwDay: {
    file: "Haus der Kulturen der Welt, Berlin, 160521, ako (1).jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Haus_der_Kulturen_der_Welt%2C_Berlin%2C_160521%2C_ako_%281%29.jpg/1280px-Haus_der_Kulturen_der_Welt%2C_Berlin%2C_160521%2C_ako_%281%29.jpg",
  },
  hkwBlueHour: {
    file: "Haus der Kulturen der Welt, Blaue Stunde, Berlin, 160521, ako.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Haus_der_Kulturen_der_Welt%2C_Blaue_Stunde%2C_Berlin%2C_160521%2C_ako.jpg/1280px-Haus_der_Kulturen_der_Welt%2C_Blaue_Stunde%2C_Berlin%2C_160521%2C_ako.jpg",
  },
  konzerthausNight: {
    file: "150524 Konzerthaus Berlin (Nacht) - clone.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/150524_Konzerthaus_Berlin_%28Nacht%29_-_clone.jpg/1280px-150524_Konzerthaus_Berlin_%28Nacht%29_-_clone.jpg",
  },
  konzerthausInterior: {
    file: "Sala de Conciertos, Berlín, Alemania, 2016-04-22, DD 22-24 HDR.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Sala_de_Conciertos%2C_Berl%C3%ADn%2C_Alemania%2C_2016-04-22%2C_DD_22-24_HDR.jpg/1280px-Sala_de_Conciertos%2C_Berl%C3%ADn%2C_Alemania%2C_2016-04-22%2C_DD_22-24_HDR.jpg",
  },
} as const;

/**
 * Build a browser-fetchable Wikimedia Commons thumbnail URL via Special:FilePath.
 * For batch seeding, prefer stable direct URLs in WIKIMEDIA_SEED_IMAGES.
 */
export function wikimediaThumbUrl(filename: string, width = 1280): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}
