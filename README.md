# VIAJES

App personal para organizar los próximos viajes. Funciona en web, iPhone y Android desde el mismo código (Expo + React Native).

## Qué hace ahora

- Lista de próximos viajes con cuenta atrás.
- Por cada viaje, secciones editables: transporte (vuelos, trenes...), alojamiento, itinerario por días y gastos con el total por categoría.
- Sugerencias de dónde comer según el tipo de viaje y el ambiente, visitas culturales y eventos que caen en las fechas del viaje (deporte, mercadillos, exposiciones, música). Cualquier sugerencia se puede añadir al itinerario.
- Cuenta con correo y contraseña: los viajes se guardan en Supabase y se ven igual en el móvil y en el ordenador. También queda una copia en el dispositivo.
- Versión web publicada en GitHub Pages: https://paolansdp.github.io/VIAJES/

Las sugerencias y los eventos son, de momento, **datos de ejemplo** para Lisboa y Roma.

## Próximos pasos

1. Sugerencias reales: Google Places para restaurantes y cultura, ordenadas por Claude según ambiente y tipo de viaje.
2. Eventos reales: Ticketmaster, PredictHQ y búsqueda web.
3. Rediseño visual.

## Cómo probarla

```bash
npm install
npm run web       # en el navegador
npm start         # y escanear el QR con la app Expo Go en el móvil
```

## Configuración

- `.env` tiene la dirección y la clave pública de Supabase. Si se quitan, la app funciona solo en el dispositivo, sin cuenta.
- `supabase/esquema.sql` crea la tabla `viajes` con sus permisos. Se ejecuta una vez en el SQL Editor de Supabase.
- `.github/workflows/web.yml` publica la web en GitHub Pages cada vez que cambia `main`.

## Estructura

- `src/app/` pantallas (Expo Router): lista de viajes, nuevo viaje y detalle del viaje.
- `src/components/` piezas de interfaz y las secciones del viaje.
- `src/data/` tipos, viajes de ejemplo y el almacén (`store.tsx`), que guarda en el dispositivo y sincroniza con Supabase.
- `src/services/recomendaciones.ts` sugerencias y eventos; aquí se conectarán las fuentes reales.
