# VIAJES

App personal para organizar los próximos viajes. Funciona en web, iPhone y Android desde el mismo código (Expo + React Native).

## Qué hace ahora

- Lista de próximos viajes con cuenta atrás.
- Por cada viaje, secciones editables: transporte (vuelos, trenes...), alojamiento, itinerario por días y gastos con el total por categoría.
- Sugerencias de dónde comer según el tipo de viaje y el ambiente, visitas culturales y eventos que caen en las fechas del viaje (deporte, mercadillos, exposiciones, música). Cualquier sugerencia se puede añadir al itinerario.
- Los datos se guardan en el propio dispositivo o navegador.

Las sugerencias y los eventos son, de momento, **datos de ejemplo** para Lisboa y Roma.

## Próximos pasos

1. Guardar los viajes en la nube con una cuenta (Supabase), para verlos igual en el móvil y en el ordenador.
2. Sugerencias reales: Google Places para restaurantes y cultura, ordenadas por Claude según ambiente y tipo de viaje.
3. Eventos reales: Ticketmaster, PredictHQ y búsqueda web.
4. Rediseño visual.

## Cómo probarla

```bash
npm install
npm run web       # en el navegador
npm start         # y escanear el QR con la app Expo Go en el móvil
```

## Estructura

- `src/app/` pantallas (Expo Router): lista de viajes, nuevo viaje y detalle del viaje.
- `src/components/` piezas de interfaz y las secciones del viaje.
- `src/data/` tipos, viajes de ejemplo y el almacén (`store.tsx`), que es lo que habrá que cambiar para sincronizar con la nube.
- `src/services/recomendaciones.ts` sugerencias y eventos; aquí se conectarán las fuentes reales.
