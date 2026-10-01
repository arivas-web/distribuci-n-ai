/**
 * Configuración de la demo. Cambia aquí el nombre del producto, la empresa
 * ficticia y los parámetros comerciales. Si cambias la empresa, el sector o
 * la fecha de la demo, vuelve a ejecutar `npm run seed`.
 */
export const brand = {
  /** Nombre del producto que se muestra en la interfaz. */
  productName: "Ryvai",
  /** Distribuidora ficticia que protagoniza la demo. */
  company: {
    name: "Distribuciones Atlántico",
    shortName: "Atlántico",
    region: "Galicia",
    sector: "Bebidas, alimentación seca y limpieza para hostelería y tiendas",
  },
  /** Persona que usa la demo (el director o jefe de ventas). */
  user: {
    name: "Elena Castro",
    role: "Directora comercial",
  },
  /** Coste mensual del servicio, para la comparación en Resultados. */
  monthlyServiceCost: 1490,
  /** Fecha y hora "actuales" de la demo. Fija para que todo cuadre siempre. */
  demoNow: "2026-09-30T13:05:00",
  /** Fecha en la que el agente empezó a trabajar con esta distribuidora. */
  agentStart: "2026-04-01",
  /** Semilla del generador de datos. */
  seed: 20260930,
} as const;

export type Brand = typeof brand;
