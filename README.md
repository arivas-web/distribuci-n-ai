# Ryvai · prototipo de demo

Prototipo navegable de una plataforma en la que un agente gestiona la relación comercial de una distribuidora B2B con sus clientes. Todos los datos son ficticios ("Distribuciones Atlántico", Galicia) y no hay backend: la demo funciona sola.

## Arrancar

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>.

## Desplegar en Vercel

Importa el repositorio en Vercel y despliega. No hace falta ninguna variable de entorno ni configuración: todas las páginas se generan estáticas en el build a partir de los JSON de `data/`.

## Cambiar nombres y parámetros

Todo está en [`config/brand.ts`](config/brand.ts):

- `productName`: el nombre del producto (Ryvai).
- `company`: nombre y sector de la distribuidora ficticia.
- `user`: la persona que usa la demo.
- `monthlyServiceCost`: el coste del servicio que aparece en Resultados.
- `demoNow`, `agentStart` y `seed`: la fecha "de hoy" de la demo, desde cuándo trabaja el agente y la semilla de los datos.

El nombre del producto se aplica al momento. Si cambias la empresa, las fechas o la semilla, regenera los datos:

```bash
npm run seed
```

Con la misma semilla, los datos salen idénticos en cada ejecución.

## Guion de la demo

- **Inicio**: frase de estado, tres cifras y la bandeja de casos en los que el agente necesita ayuda. Basta un clic en una opción para resolver un caso. Si resuelves Restaurante A Lareira y Cafetería Alameda con la opción recomendada (aceite de 2 L), aparece la propuesta de regla.
- **Historia guiada** (barra lateral, o menú «⋯» en el móvil): recorre el caso del Bar O Peirao: bandeja, ficha con el gráfico, conversación, aprobación del descuento, pedido cerrado y euros en Resultados.
- **Modo demo**: simula actividad en directo cada pocos segundos. Se para con el mismo botón.
- **Reiniciar demo**: devuelve todo al estado inicial. Recargar la página también lo hace.

## Estructura

```
config/brand.ts          Nombre del producto, empresa y parámetros de la demo
scripts/seed.ts          Generador de datos con semilla fija → data/*.json
scripts/seed/            Catálogo, nombres, plantillas de conversación y casos atascados
data/                    JSON generados (se versionan)
src/types/               Modelo de datos compartido por el generador y la app
src/lib/data/            Capa de datos: hoy lee los JSON
src/lib/store/demo.ts    Estado de la demo en memoria (Zustand)
src/app/                 Pantallas (App Router)
src/components/          Componentes de interfaz
```

## Conectar datos reales más adelante

Las pantallas solo leen datos a través de `src/lib/data/index.ts`, y los tipos están en `src/types`. Para conectar un ERP, un CRM o el canal de WhatsApp, reimplementa esas funciones con la nueva fuente y devuelve objetos con la misma forma. El estado de la demo (`src/lib/store/demo.ts`) es lo que se sustituiría por llamadas a un backend.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · componentes al estilo shadcn/ui sobre Radix · Recharts · lucide-react · Zustand.
