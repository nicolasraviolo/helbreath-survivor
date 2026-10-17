# Publicar el juego en Cloudflare Pages

Cloudflare Pages es gratis. Te da un enlace propio (por ejemplo `https://helbreath-survivors.pages.dev`). Cada vez que se sube a `master` en GitHub, **vuelve a construir y publicar el juego solo**, en un par de minutos.

Esto se hace **una sola vez**. Lo tienes que hacer tú, porque hay que crear una cuenta y dar permiso a GitHub (Claude no puede crear cuentas).

## 1. Crear la cuenta
1. Entra en https://dash.cloudflare.com/sign-up.
2. Crea una cuenta gratuita con tu email.
3. Confirma el email.

## 2. Conectar el repositorio de GitHub
1. En el panel de Cloudflare, menú de la izquierda: **Workers & Pages**.
2. Pulsa **Create** → pestaña **Pages** → **Connect to Git**.
3. Elige **GitHub** y autoriza a Cloudflare.
   - Cuando GitHub pregunte a qué repositorios puede entrar, basta con **solo `helbreath-survivor`**.
4. Elige el repositorio `nicolasraviolo/helbreath-survivor` y pulsa **Begin setup**.

## 3. Ajustes del proyecto (cópialos tal cual)
| Campo | Valor |
|---|---|
| Project name | `helbreath-survivors` (será parte del enlace) |
| Production branch | `master` |
| Framework preset | `None` |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory (en *Advanced*) | `survivors` |

En **Environment variables** (también en *Advanced*), añade estas dos:
| Variable | Valor |
|---|---|
| `NODE_VERSION` | `22.18.0` |
| `PNPM_VERSION` | `12.14.0` |

Pulsa **Save and Deploy**. El primer despliegue tarda unos minutos.

**Si sale en verde**, Cloudflare te da el enlace `https://<nombre>.pages.dev`. Ábrelo en el PC y en el móvil.

## 4. Si algo falla
- En la página del proyecto, pestaña **Deployments**, abre el despliegue fallido y copia el registro (*build log*). Pásaselo a Claude.
- **Error típico:** "No asset paths found" o "missing in sp-client". El build no encuentra los assets: revisa que *Root directory* sea `survivors`.

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
