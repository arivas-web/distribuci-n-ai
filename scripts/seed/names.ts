import type { BusinessType, SalesRep, Zone } from "../../src/types";

export const zones: Zone[] = [
  { id: "vigo", name: "Vigo", coastal: true },
  { id: "baiona", name: "Baiona", coastal: true },
  { id: "cangas", name: "Cangas", coastal: true },
  { id: "marin", name: "Marín", coastal: true },
  { id: "pontevedra", name: "Pontevedra", coastal: true },
  { id: "sanxenxo", name: "Sanxenxo", coastal: true },
  { id: "ogrove", name: "O Grove", coastal: true },
  { id: "cambados", name: "Cambados", coastal: true },
  { id: "vilagarcia", name: "Vilagarcía de Arousa", coastal: true },
  { id: "ourense", name: "Ourense", coastal: false },
  { id: "porrino", name: "O Porriño", coastal: false },
  { id: "ponteareas", name: "Ponteareas", coastal: false },
  { id: "lalin", name: "Lalín", coastal: false },
];

/** Peso de cada zona en el reparto de clientes. */
export const zoneWeights: [string, number][] = [
  ["vigo", 70],
  ["baiona", 14],
  ["cangas", 18],
  ["marin", 12],
  ["pontevedra", 34],
  ["sanxenxo", 26],
  ["ogrove", 16],
  ["cambados", 12],
  ["vilagarcia", 18],
  ["ourense", 40],
  ["porrino", 12],
  ["ponteareas", 12],
  ["lalin", 10],
];

export const reps: SalesRep[] = [
  { id: "r1", name: "Marta Iglesias", zones: ["vigo", "baiona"] },
  { id: "r2", name: "Xoán Pereira", zones: ["cangas", "marin", "pontevedra"] },
  { id: "r3", name: "Lucía Fernández", zones: ["sanxenxo", "ogrove", "cambados", "vilagarcia"] },
  { id: "r4", name: "Andrés Rial", zones: ["ourense", "porrino", "ponteareas", "lalin"] },
];

export const firstNames = [
  "Manuel", "José", "Carmen", "María", "Pilar", "Xosé", "Antonio", "Rosa", "Ramón", "Uxía",
  "Brais", "Iago", "Sabela", "Marcos", "Lorena", "Noelia", "David", "Rubén", "Paula", "Ánxela",
  "Fernando", "Susana", "Pablo", "Beatriz", "Óscar", "Alba", "Javier", "Montse", "Luis", "Isabel",
  "Diego", "Raquel", "Alberto", "Cristina", "Iván", "Silvia", "Hugo", "Nerea", "Tomás", "Marisa",
  "Roberto", "Lidia", "Adrián", "Begoña", "Xabier", "Carla", "Sergio", "Elvira", "Moncho", "Tere",
];

export const surnames = [
  "Martínez", "Rial", "Soto", "Conde", "Lorenzo", "Pereira", "Barreiro", "Nogueira", "Ríos", "Otero",
  "Vázquez", "Fernández", "Iglesias", "Castro", "Lago", "Rey", "Pazos", "Seoane", "Varela", "Fraga",
  "Mosquera", "Outeiro", "Couto", "Carballo", "Piñeiro", "Sobrino", "Gil", "Domínguez", "Abal", "Freire",
  "Losada", "Taboada", "Cid", "Bouzas", "Graña", "Pena", "Prieto", "Míguez", "Sanmartín", "Estévez",
];

const barNames = [
  "O Peirao", "A Ribeira", "O Cruceiro", "Os Amigos", "O Recanto", "A Esquina", "Galaico", "O Porto",
  "Mariñeiro", "Central", "O Muíño", "A Fonte", "Xeito", "O Faro", "Avenida", "Os Arcos", "A Praza",
  "Berbés", "O Castro", "O Pazo", "A Pedra", "Vello", "O Cabo", "A Ría", "Sol", "A Lúa", "Brétema",
  "A Barca", "O Aturuxo", "Os Tilos", "Celta", "O Hórreo", "A Lancha", "O Areal", "O Trasno",
  "A Gamboa", "O Muro", "Bouzas", "A Ferrería", "O Cantón", "San Roque", "O Mirador", "A Xunqueira",
  "O Batel", "A Rula", "O Embarcadoiro", "Os Pinos", "A Carballeira", "O Paseo", "A Estación",
  "O Couto", "Liceo", "A Taza", "O Bocoi", "Miramar", "O Remo", "A Dorna", "Nautilus", "Ultramar",
  "O Lar", "A Ponte", "Lusitano", "O Recreo", "Victoria", "La Peña", "O Canteiro", "Palmeiras",
];
const cafeNames = [
  "Alameda", "Colón", "Brais", "Siglo XXI", "Victoria", "Ideal", "Moderna", "Princesa", "La Oficina",
  "Real", "Imperial", "Bonaval", "Paseo", "Areal", "Ronda", "Do Mar", "Uxía", "Nova", "Dársena",
  "Porta do Sol", "Herrerías", "Ferrol", "Sabaris", "Praza Maior", "Rosalía", "Teatro", "Odeón",
  "A Peregrina", "Castelao", "Arcadia", "Galería", "Vilas", "Ébano", "Canela", "Bambú", "Paxariño",
  "Lusitania", "Marítimo", "Bohemia", "Olimpia", "Trébol", "Atenea", "Gran Vía", "Venecia", "Saudade",
  "Aurora", "Capitol", "Neptuno", "Sirena", "Belén", "Mercado", "Xardín", "Lonxa", "Bellas Artes",
];
const restaurantNames = [
  "Restaurante A Lareira", "Restaurante O Fogón", "Casa Pepe", "Restaurante O Pescador", "Mesón O Forno",
  "Taberna do Porto", "Casa Marcelo", "Restaurante O Grelo", "A Cociña de Sara", "Casa Rosalía",
  "Restaurante O Lagar", "A Mareira", "Taberna O Escondite", "Casa Ramallo", "Restaurante O Xantar",
  "Casa Senra", "Pulpería A Feira", "Marisquería O Bico", "Pulpería O Carballiño", "Restaurante A Vide",
  "Mesón Os Arcos", "Taberna A Cunca", "Restaurante Mar de Ons", "Casa Chiruca", "Restaurante O Viveiro",
  "Mesón O Cabazo", "Taberna Os Arcos", "Restaurante A Illa", "Casa Fandiño", "Marisquería A Centolla",
  "Restaurante Ribeira Sacra", "Pulpería Casa Lola", "Taberna O Tasco", "Restaurante Albariño",
  "Mesón A Rúa", "Restaurante O Faiado", "Casa do Arco", "Restaurante Praia", "Taberna A Bodeguilla",
  "Restaurante As Garzas", "Churrasquería O Castiñeiro", "Churrasquería Os Pinos", "Restaurante O Muíño",
  "Casa Sindo", "Restaurante A Taberna de Elisa", "Marisquería Os Mariñeiros", "Mesón do Pulpo",
  "Restaurante Casa Paz", "Taberna O Galo", "Restaurante O Recuncho", "Casa Esperanza",
  "Restaurante Costa Brava", "Pulpería O Remanso", "Restaurante Galicia", "Mesón O Pote",
  "Taberna A Lonxa", "Restaurante Os Castros", "Restaurante O Varadoiro", "Casa Pancho", "A Taberna de Moncho",
  "Restaurante O Lavadoiro", "Mesón O Cruceiro", "Taberna Nordeste", "Restaurante As Dunas",
];
const hotelNames = [
  "Hotel Bahía", "Hotel Mar de Sanxenxo", "Hotel Ría de Arousa", "Hotel Os Castros", "Hotel Atalaia",
  "Hotel Rompeolas", "Hotel Miramar", "Hotel Bela Vista", "Hostal A Ponte", "Hostal Rías Baixas",
  "Pensión O Camiño", "Hotel Praia Silgar", "Hotel Termal Ourense", "Hostal Os Arcos", "Hotel A Toxa Mar",
  "Hotel Cíes", "Hotel Monte Faro", "Hostal Vista Alegre",
];
const pubNames = [
  "Pub Vértigo", "Pub Ítaca", "Pub A Lúa", "Discopub Faro", "Pub Índigo", "Pub La Habana", "Bar de copas Maré",
  "Pub Ultramar", "Pub Barbantia", "Pub O Atlántico", "Pub Nébula", "Pub Kraken", "Pub Garaxe",
  "Pub Calamar", "Pub Dublín", "Pub Sargo", "Pub A Noite", "Pub Ventolín", "Pub Medusa", "Pub Ancla",
];
const shopPrefixes = ["Alimentación", "Ultramarinos", "Comestibles", "Tienda", "Despensa"];
const superPrefixes = ["Supermercado", "Autoservicio", "Súper"];
const bakeryPrefixes = ["Panadería", "Panadería-Cafetería", "Obrador", "Forno"];
const hardwarePrefixes = ["Ferretería", "Droguería", "Ferretería y Droguería"];

export function businessNameCandidates(type: BusinessType): string[] {
  switch (type) {
    case "bar":
      return [
        ...barNames.filter((n) => n !== "O Peirao").map((n) => `Bar ${n}`),
        ...barNames.slice(30).map((n) => `Café Bar ${n}`),
        ...firstNames.slice(0, 30).map((n) => `Bar ${n}`),
      ];
    case "cafeteria":
      return [...cafeNames.map((n) => `Cafetería ${n}`), ...cafeNames.slice(0, 20).map((n) => `Café ${n}`)];
    case "restaurante":
      return restaurantNames;
    case "hotel":
      return hotelNames;
    case "pub":
      return pubNames;
    case "tienda":
      return shopPrefixes.flatMap((p) => surnames.map((s) => `${p} ${s}`));
    case "supermercado":
      return superPrefixes.flatMap((p) => surnames.map((s) => `${p} ${s}`));
    case "panaderia":
      return bakeryPrefixes.flatMap((p) => surnames.map((s) => `${p} ${s}`));
    case "ferreteria":
      return hardwarePrefixes.flatMap((p) => surnames.map((s) => `${p} ${s}`));
  }
}

export const streets = [
  "Rúa do Príncipe", "Avenida de Galicia", "Rúa Real", "Praza da Constitución", "Rúa do Mar",
  "Avenida Castelao", "Rúa Rosalía de Castro", "Rúa San Roque", "Rúa da Ribeira", "Avenida de Vigo",
  "Rúa Nova", "Paseo Marítimo", "Rúa do Porto", "Rúa Concepción Arenal", "Avenida da Mariña",
  "Rúa Curros Enríquez", "Rúa do Progreso", "Praza do Concello", "Rúa Venezuela", "Rúa Pastor Díaz",
];

/** Parte distintiva del nombre, para no repetir "Bar Ferrol" y "Café Ferrol". */
export function nameCore(name: string): string {
  return name
    .replace(/^(Café Bar|Bar de copas|Bar|Cafetería|Café|Pub|Discopub|Hotel|Hostal|Pensión|Panadería-Cafetería|Panadería|Obrador|Forno|Ferretería y Droguería|Ferretería|Droguería|Alimentación|Ultramarinos|Comestibles|Tienda|Despensa|Supermercado|Autoservicio|Súper)\s+/, "")
    .toLowerCase();
}
