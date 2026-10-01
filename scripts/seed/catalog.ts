import type { BusinessType, Family, Product } from "../../src/types";
import type { Rng } from "./rng";

export const families: Family[] = [
  { id: "barril", name: "Cerveza de barril", margin: 0.24 },
  { id: "envasada", name: "Cerveza envasada", margin: 0.22 },
  { id: "refrescos", name: "Refrescos y zumos", margin: 0.26 },
  { id: "aguas", name: "Aguas", margin: 0.3 },
  { id: "vinos", name: "Vinos", margin: 0.28 },
  { id: "licores", name: "Licores y destilados", margin: 0.25 },
  { id: "cafe", name: "Café e infusiones", margin: 0.34 },
  { id: "seca", name: "Alimentación seca", margin: 0.2 },
  { id: "aceites", name: "Aceites y conservas", margin: 0.18 },
  { id: "limpieza", name: "Limpieza e higiene", margin: 0.32 },
];

type Template = { name: string; format: string; price: [number, number] };

const brands: Record<string, string[]> = {
  barril: ["Cíes", "Ons", "Sálvora", "Miño", "Ría Baixa"],
  envasada: ["Cíes", "Ons", "Sálvora", "Miño", "Ría Baixa"],
  refrescos: ["Fresca", "Nébora", "Valdemar", "Sorrisa", "Citria"],
  aguas: ["Fonte Clara", "Aguas do Xurés", "Monte Pindo", "Sousas Mar", "Manancial Norte"],
  vinos: ["Pazo de Lusía", "Adega Vilar", "Terras do Avia", "Viña Mareira", "Bodegas Sil"],
  licores: ["Orballo", "Brétema", "Faro Norte", "Destilerías Ulla", "Casa Arbo"],
  cafe: ["Café Atlántida", "Tostadero Morrazo", "Café Seixo", "Infusiones Herba", "Café Porto"],
  seca: ["Despensa Galega", "Grano de Oro", "Molino Real", "La Huerta", "Campo Norte"],
  aceites: ["Olivar del Sur", "Conservas Ría", "Mar de Arousa", "Oro Verde", "Conservas Illa"],
  limpieza: ["Brillo Pro", "Hostel Clean", "Nítido", "Profesional H", "Higiene Total"],
};

const templates: Record<string, Template[]> = {
  barril: [
    { name: "Cerveza lager especial", format: "Barril 30 L", price: [98, 112] },
    { name: "Cerveza lager especial", format: "Barril 20 L", price: [70, 80] },
    { name: "Cerveza tostada", format: "Barril 30 L", price: [104, 118] },
    { name: "Cerveza sin alcohol", format: "Barril 20 L", price: [66, 74] },
    { name: "Cerveza de trigo", format: "Barril 20 L", price: [80, 92] },
    { name: "Cerveza IPA artesana", format: "Barril 20 L", price: [92, 108] },
    { name: "Cerveza lager clásica", format: "Barril 50 L", price: [140, 160] },
    { name: "Sidra natural", format: "Barril 20 L", price: [62, 70] },
    { name: "Cerveza 0,0 tostada", format: "Barril 20 L", price: [68, 76] },
    { name: "Cerveza especial extra", format: "Barril 30 L", price: [110, 124] },
  ],
  envasada: [
    { name: "Cerveza lager especial", format: "Caja 24 × 1/3", price: [19, 23] },
    { name: "Cerveza lager especial", format: "Caja 30 × 1/5", price: [16, 19] },
    { name: "Cerveza lager", format: "Pack 24 latas 33 cl", price: [15, 18] },
    { name: "Cerveza sin alcohol", format: "Caja 24 × 1/3", price: [17, 20] },
    { name: "Cerveza tostada", format: "Caja 24 × 1/3", price: [20, 24] },
    { name: "Cerveza 0,0", format: "Pack 24 latas 33 cl", price: [15, 18] },
    { name: "Cerveza especial", format: "Caja 12 × 1 L", price: [16, 19] },
    { name: "Cerveza radler limón", format: "Caja 24 × 1/3", price: [17, 20] },
    { name: "Cerveza sin gluten", format: "Caja 24 × 1/3", price: [21, 25] },
    { name: "Cerveza artesana", format: "Caja 12 × 33 cl", price: [22, 28] },
  ],
  refrescos: [
    { name: "Refresco de cola", format: "Caja 24 × 20 cl", price: [14, 17] },
    { name: "Refresco de cola zero", format: "Caja 24 × 20 cl", price: [14, 17] },
    { name: "Refresco de naranja", format: "Caja 24 × 20 cl", price: [13, 16] },
    { name: "Refresco de limón", format: "Caja 24 × 20 cl", price: [13, 16] },
    { name: "Tónica", format: "Caja 24 × 20 cl", price: [15, 18] },
    { name: "Refresco de cola", format: "Pack 24 latas 33 cl", price: [15, 18] },
    { name: "Zumo de naranja", format: "Caja 24 × 20 cl", price: [15, 18] },
    { name: "Zumo de piña", format: "Caja 24 × 20 cl", price: [15, 18] },
    { name: "Bebida isotónica", format: "Caja 24 × 50 cl", price: [18, 22] },
    { name: "Gaseosa", format: "Caja 12 × 1,5 L", price: [7, 9] },
  ],
  aguas: [
    { name: "Agua mineral", format: "Pack 6 × 1,5 L", price: [2.4, 3.2] },
    { name: "Agua mineral", format: "Caja 24 × 50 cl", price: [5, 6.5] },
    { name: "Agua mineral cristal", format: "Caja 24 × 33 cl", price: [8, 10] },
    { name: "Agua con gas", format: "Caja 24 × 33 cl", price: [9, 11] },
    { name: "Agua mineral cristal", format: "Caja 12 × 1 L", price: [9, 11] },
    { name: "Agua mineral", format: "Garrafa 5 L", price: [1.2, 1.6] },
    { name: "Agua con gas", format: "Caja 24 × 50 cl", price: [7, 9] },
    { name: "Agua mineral sport", format: "Caja 24 × 75 cl", price: [8, 10] },
    { name: "Agua mineral", format: "Caja 35 × 33 cl", price: [6, 7.5] },
    { name: "Agua con gas cristal", format: "Caja 12 × 1 L", price: [10, 12] },
  ],
  vinos: [
    { name: "Albariño", format: "Caja 6 × 75 cl", price: [48, 66] },
    { name: "Ribeiro blanco", format: "Caja 6 × 75 cl", price: [26, 34] },
    { name: "Mencía joven", format: "Caja 6 × 75 cl", price: [34, 44] },
    { name: "Godello", format: "Caja 6 × 75 cl", price: [44, 58] },
    { name: "Rioja crianza", format: "Caja 6 × 75 cl", price: [36, 50] },
    { name: "Ribera crianza", format: "Caja 6 × 75 cl", price: [42, 56] },
    { name: "Vino blanco de la casa", format: "Bag in box 15 L", price: [22, 28] },
    { name: "Vino tinto de la casa", format: "Bag in box 15 L", price: [22, 28] },
    { name: "Cava brut", format: "Caja 6 × 75 cl", price: [30, 40] },
    { name: "Ribeiro tinto", format: "Caja 6 × 75 cl", price: [28, 36] },
  ],
  licores: [
    { name: "Ginebra London Dry", format: "Botella 70 cl", price: [11, 19] },
    { name: "Ron añejo", format: "Botella 70 cl", price: [12, 20] },
    { name: "Whisky blended", format: "Botella 70 cl", price: [11, 18] },
    { name: "Licor de hierbas", format: "Botella 70 cl", price: [9, 13] },
    { name: "Aguardiente de orujo", format: "Botella 70 cl", price: [10, 15] },
    { name: "Licor café", format: "Botella 70 cl", price: [9, 13] },
    { name: "Vermut rojo", format: "Botella 1 L", price: [7, 10] },
    { name: "Vodka", format: "Botella 70 cl", price: [10, 16] },
    { name: "Crema de orujo", format: "Botella 70 cl", price: [9, 13] },
    { name: "Brandy", format: "Botella 70 cl", price: [9, 14] },
  ],
  cafe: [
    { name: "Café en grano mezcla 80/20", format: "Bolsa 1 kg", price: [14, 18] },
    { name: "Café en grano natural", format: "Bolsa 1 kg", price: [16, 21] },
    { name: "Café descafeinado", format: "Caja 100 sobres", price: [9, 12] },
    { name: "Café molido", format: "Bolsa 1 kg", price: [13, 17] },
    { name: "Infusión manzanilla", format: "Caja 100 bolsitas", price: [6, 8] },
    { name: "Infusión poleo menta", format: "Caja 100 bolsitas", price: [6, 8] },
    { name: "Té negro", format: "Caja 100 bolsitas", price: [7, 9] },
    { name: "Cacao soluble", format: "Bote 2 kg", price: [12, 15] },
    { name: "Azúcar en sobres", format: "Caja 1.000 uds", price: [8, 11] },
    { name: "Leche entera", format: "Caja 6 × 1,5 L", price: [6.5, 8] },
  ],
  seca: [
    { name: "Arroz redondo", format: "Saco 5 kg", price: [5.5, 7] },
    { name: "Macarrones", format: "Caja 5 kg", price: [6.5, 8.5] },
    { name: "Espaguetis", format: "Caja 5 kg", price: [6.5, 8.5] },
    { name: "Garbanzos", format: "Bolsa 1 kg", price: [2.2, 3] },
    { name: "Lentejas", format: "Bolsa 1 kg", price: [2, 2.8] },
    { name: "Harina de trigo", format: "Saco 25 kg", price: [13, 16] },
    { name: "Azúcar blanco", format: "Saco 10 kg", price: [9, 11] },
    { name: "Pan rallado", format: "Bolsa 5 kg", price: [8, 10] },
    { name: "Sal marina", format: "Caja 10 kg", price: [4, 5.5] },
    { name: "Patatas fritas", format: "Caja 10 bolsas", price: [12, 16] },
  ],
  aceites: [
    { name: "Aceite de oliva virgen extra", format: "Garrafa 5 L", price: [36, 44] },
    { name: "Aceite de oliva virgen extra", format: "Botella 2 L", price: [15.5, 18.5] },
    { name: "Aceite de girasol", format: "Garrafa 5 L", price: [9, 12] },
    { name: "Aceite de oliva suave", format: "Garrafa 5 L", price: [30, 36] },
    { name: "Atún en aceite", format: "Lata 1 kg", price: [10, 14] },
    { name: "Mejillón en escabeche", format: "Lata 550 g", price: [7, 9] },
    { name: "Tomate frito", format: "Bote 3 kg", price: [5, 6.5] },
    { name: "Vinagre de vino", format: "Garrafa 5 L", price: [4, 5.5] },
    { name: "Pimientos del piquillo", format: "Lata 3 kg", price: [9, 12] },
    { name: "Berberechos al natural", format: "Caja 10 latas", price: [18, 24] },
  ],
  limpieza: [
    { name: "Lavavajillas máquina industrial", format: "Garrafa 20 L", price: [32, 44] },
    { name: "Abrillantador máquina", format: "Garrafa 10 L", price: [22, 30] },
    { name: "Lejía", format: "Garrafa 5 L", price: [2.4, 3.2] },
    { name: "Friegasuelos", format: "Garrafa 5 L", price: [5.5, 7.5] },
    { name: "Papel secamanos", format: "Pack 6 rollos", price: [16, 21] },
    { name: "Servilletas 30×30", format: "Caja 3.000 uds", price: [20, 26] },
    { name: "Bolsas de basura 100 L", format: "Rollo 10 uds", price: [3, 4.5] },
    { name: "Guantes de nitrilo", format: "Caja 100 uds", price: [6, 9] },
    { name: "Desengrasante cocina", format: "Garrafa 5 L", price: [9, 13] },
    { name: "Jabón de manos", format: "Garrafa 5 L", price: [6, 9] },
  ],
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Productos con identificador fijo que aparecen en los casos preparados. */
export const featured = {
  barrilPeirao: "p-barril-cies-0",
  aceite5L: "p-aceites-olivar-del-sur-0",
  aceite2L: "p-aceites-olivar-del-sur-1",
  aceiteSuave5L: "p-aceites-oro-verde-3",
  cafeGrano: "p-cafe-cafe-atlantida-0",
  albarino: "p-vinos-pazo-de-lusia-0",
  ribeiro: "p-vinos-pazo-de-lusia-1",
  mencia: "p-vinos-pazo-de-lusia-2",
};

export function buildCatalog(rng: Rng): Product[] {
  const products: Product[] = [];
  let skuCounter = 10000;
  for (const fam of families) {
    for (const brand of brands[fam.id]) {
      templates[fam.id].forEach((t, i) => {
        const slug = brand
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-");
        const price = round2(rng.float(t.price[0], t.price[1]));
        const margin = fam.margin + rng.float(-0.04, 0.04);
        products.push({
          id: `p-${fam.id}-${slug}-${i}`,
          sku: `AT-${skuCounter++}`,
          name: `${t.name} ${brand}`,
          familyId: fam.id,
          format: t.format,
          price,
          cost: round2(price * (1 - margin)),
          stock: rng.chance(0.04) ? 0 : rng.int(12, 420),
        });
      });
    }
  }
  // Ajustes para los casos preparados.
  const byId = new Map(products.map((p) => [p.id, p]));
  const aceite5 = byId.get(featured.aceite5L)!;
  aceite5.stock = 0;
  aceite5.price = 41.9;
  aceite5.cost = 34.8;
  const aceite2 = byId.get(featured.aceite2L)!;
  aceite2.stock = 186;
  aceite2.price = 17.2;
  aceite2.cost = 14.1;
  const barril = byId.get(featured.barrilPeirao)!;
  barril.price = 104.5;
  barril.cost = 79.4;
  barril.stock = 140;
  return products;
}

/** Peso de cada familia en el ticket según el tipo de negocio. */
export const familyMix: Record<BusinessType, Record<string, number>> = {
  bar: { barril: 0.3, envasada: 0.14, refrescos: 0.16, aguas: 0.06, vinos: 0.08, licores: 0.1, cafe: 0.1, seca: 0.02, aceites: 0.02, limpieza: 0.02 },
  cafeteria: { barril: 0.1, envasada: 0.08, refrescos: 0.18, aguas: 0.08, vinos: 0.03, licores: 0.06, cafe: 0.3, seca: 0.08, aceites: 0.03, limpieza: 0.06 },
  restaurante: { barril: 0.12, envasada: 0.06, refrescos: 0.1, aguas: 0.1, vinos: 0.25, licores: 0.06, cafe: 0.07, seca: 0.1, aceites: 0.1, limpieza: 0.04 },
  hotel: { barril: 0.08, envasada: 0.08, refrescos: 0.12, aguas: 0.14, vinos: 0.16, licores: 0.1, cafe: 0.1, seca: 0.08, aceites: 0.06, limpieza: 0.08 },
  pub: { barril: 0.2, envasada: 0.14, refrescos: 0.22, aguas: 0.04, vinos: 0.02, licores: 0.36, cafe: 0.01, limpieza: 0.01 },
  tienda: { envasada: 0.14, refrescos: 0.14, aguas: 0.12, vinos: 0.12, licores: 0.06, cafe: 0.06, seca: 0.2, aceites: 0.12, limpieza: 0.04 },
  supermercado: { envasada: 0.12, refrescos: 0.12, aguas: 0.12, vinos: 0.1, licores: 0.06, cafe: 0.05, seca: 0.18, aceites: 0.13, limpieza: 0.12 },
  panaderia: { refrescos: 0.14, aguas: 0.08, cafe: 0.4, seca: 0.28, aceites: 0.05, limpieza: 0.05 },
  ferreteria: { limpieza: 1 },
};

/** Ticket medio [mín, máx] y probabilidad de pedir cada semana. */
export const typeProfile: Record<BusinessType, { ticket: [number, number]; weekly: number; count: number }> = {
  bar: { ticket: [170, 420], weekly: 0.78, count: 95 },
  cafeteria: { ticket: [140, 320], weekly: 0.72, count: 42 },
  restaurante: { ticket: [320, 850], weekly: 0.8, count: 60 },
  hotel: { ticket: [520, 1400], weekly: 0.6, count: 14 },
  pub: { ticket: [280, 720], weekly: 0.5, count: 17 },
  tienda: { ticket: [220, 620], weekly: 0.4, count: 30 },
  supermercado: { ticket: [900, 2100], weekly: 0.85, count: 12 },
  panaderia: { ticket: [120, 280], weekly: 0.5, count: 18 },
  ferreteria: { ticket: [150, 380], weekly: 0.15, count: 12 },
};
