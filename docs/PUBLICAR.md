# Publicar el juego (GitHub Pages)

> **El juego solo se publica en GitHub Pages.** Cloudflare Pages está desactivado desde el 17-oct-2026, porque el propietario prefiere mantener el proyecto discreto (*low profile*). Al final queda una guía por si algún día se vuelve a usar.

- **Enlace:** https://nicolasraviolo.github.io/helbreath-survivor/
- **Actualización:** se publica sola en cada subida a `master`, con `.github/workflows/pages.yml`, en unos 3–5 minutos. Ejecuta `pnpm build` en `survivors/` y publica `survivors/dist`.
- **Comprobar que un cambio ya está publicado:** en GitHub, pestaña **Actions** → "Deploy to GitHub Pages". El despliegue de tu último commit debe tener la marca verde. Luego abre el enlace y recarga con **Ctrl+F5** para no ver la versión antigua guardada en el navegador.
- **Publicar a mano** (sin subir nada nuevo): **Actions** → "Deploy to GitHub Pages" → **Run workflow**.

## Activarlo (una sola vez; ya está hecho)
1. En GitHub, abre el repositorio → **Settings** → **Pages** (menú de la izquierda).
2. En **Build and deployment** → **Source**, elige **GitHub Actions**. Nada más: no hay que pulsar "Save".
3. En la pestaña **Actions** sale "Deploy to GitHub Pages". Si no se ha lanzado solo, ábrelo y pulsa **Run workflow**.
4. Al terminar (unos 3–5 minutos, con marca verde), abre el enlace.

## Si algo falla
Abre el despliegue en rojo de la pestaña **Actions**, copia el paso que falló y pásaselo a Claude.
- **Error típico:** "No asset paths found" o "missing in sp-client". El build no encuentra los assets de `sp-client/public/assets`.

## Cómo funciona por dentro
- `pnpm build` hace tres cosas:
  1. comprueba los tipos;
  2. ejecuta `scripts/sync-assets.mjs`, que copia de `sp-client/public/assets` solo los archivos de `src/config/assetManifest.ts`;
  3. construye el juego en `dist/`.
- `dist/` ocupa unos 86 MB, porque lleva todas las casillas de mapa del manifest. Pero el navegador solo descarga lo que usa:
  - **unos 35 MB antes del menú**;
  - el resto de monstruos (unos 15 MB) mientras estás en el menú o jugando.
- Para probar la versión publicada en tu PC antes de subirla:
  1. `pnpm --dir survivors build`
  2. `pnpm --dir survivors preview --port 8091`
  3. Abre http://localhost:8091.

## Alternativa: itch.io (a mano)
1. Ejecuta `pnpm --dir survivors build`.
2. Comprime en un zip el **contenido** de `survivors/dist/`: el `index.html` tiene que quedar en la raíz del zip.
3. En itch.io, crea un proyecto de tipo **HTML** y sube el zip.
4. Marca "This file will be played in the browser" y ponle un tamaño de 800×600.

Hay que repetirlo cada vez que cambie el juego. Ojo: itch.io limita a 1000 archivos y 500 MB por zip (vamos muy por debajo).

## Archivo: Cloudflare Pages (desactivado)
Solo por si algún día se quiere volver a usar. Se configuraba una sola vez y lo tenía que hacer el propietario, porque hay que crear una cuenta y dar permiso a GitHub (Claude no puede crear cuentas).

1. Crear una cuenta gratuita en https://dash.cloudflare.com/sign-up y confirmar el email.
2. En el panel: **Compute (Workers)** → **Workers & Pages** → **Create**. **No crear un Worker**: pestaña **Pages** (o "Looking to deploy Pages? Get started") → **Import an existing Git repository**.
3. Elegir **GitHub**, autorizar a Cloudflare (basta con el repositorio `helbreath-survivor`) y pulsar **Begin setup** con `nicolasraviolo/helbreath-survivor`.
4. Ajustes (tal cual):

| Campo | Valor |
|---|---|
| Project name | `helbreath-survivors` (enlace `https://helbreath-survivors.pages.dev`) |
| Production branch | `master` |
| Framework preset | `None` (o en blanco) |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory (en *Advanced*) | `survivors` |
| Variable `NODE_VERSION` | `22.18.0` |
| Variable `PNPM_VERSION` | `12.14.0` |

5. **Save and Deploy**. Desde entonces se publicaba sola en cada subida a `master`.

Problema conocido: en España, durante los partidos de LaLiga, los proveedores de internet bloquean parte de las IPs de Cloudflare. El enlace no carga aunque el juego esté bien publicado (pasó el 17-oct-2026).
