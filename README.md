# En venta — showcase de productos

Sitio estático minimalista para mostrar productos en venta entre familia y amigos. Sin build, sin dependencias: HTML + CSS + JS + un JSON.

## Estructura

```
.
├── index.html      # Página principal
├── styles.css      # Animaciones y detalles del modal/galería
├── app.js          # Grid, diálogo, galería y deep links
├── products.json   # Datos de los 8 productos (editar acá)
└── img/            # Fotos .webp
```

## Editar productos

Abrí `products.json` y cambiá los placeholders:

| Campo         | Descripción                                      |
|---------------|--------------------------------------------------|
| `name`        | Nombre del producto                              |
| `price`       | Precio en pesos (número, sin puntos)             |
| `link`        | URL de la publicación original (opcional)        |
| `description` | Texto largo                                     |
| `condition`   | Estado (ej. "Muy buen estado")                   |
| `dimensions`  | Medidas                                          |
| `status`      | `disponible`, `reservado` o `vendido`            |
| `images`      | Lista de rutas relativas a las fotos             |

Cuando un producto pase a `reservado` o `vendido`, se muestra un badge en la grilla y en el detalle.

## Probar en local

`fetch` de `products.json` no funciona abriendo el HTML con doble click (`file://`). Usá un servidor:

```bash
python3 -m http.server 8000
```

Después abrí [http://localhost:8000](http://localhost:8000).

## Compartir un producto

Cada producto tiene un deep link por hash, por ejemplo:

`https://tu-sitio.vercel.app/#sofa`

Al abrir ese link se carga el modal de ese producto.

## WhatsApp

El número está en `app.js` (`WHATSAPP_NUMBER`) y el botón del header. El mensaje del producto es:

`Hola! Estoy interesado en {nombre}`

## Publicar en Vercel (recomendado)

1. Subí el repo a GitHub (o usá el CLI).
2. En [vercel.com](https://vercel.com) → **Add New Project** → importá el repo.
3. Framework preset: **Other**. Build command vacío. Output: raíz del proyecto.
4. Deploy. Cada push a `main` vuelve a publicar solo.

Alternativa sin Git: arrastrá la carpeta del proyecto a [vercel.com/new](https://vercel.com/new).

Otras opciones igual de válidas: **Netlify Drop**, **Cloudflare Pages**, **GitHub Pages**.

## Notas

- Las imágenes son portrait 3:4 (~1920×2560). La grilla las muestra con `object-cover` y lazy loading.
- Si querés aligerar la carga inicial, generá thumbs más chicas y usalas en la grilla (las originales quedan para el modal).
