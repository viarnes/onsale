const WHATSAPP_NUMBER = "5491162070094";
const STATUS_LABELS = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const gridEl = document.getElementById("product-grid");
const dialogEl = document.getElementById("product-dialog");
const dialogCloseBtn = document.getElementById("dialog-close");
const galleryTrack = document.getElementById("gallery-track");
const galleryThumbs = document.getElementById("gallery-thumbs");
const galleryPrev = document.getElementById("gallery-prev");
const galleryNext = document.getElementById("gallery-next");
const dialogTitle = document.getElementById("dialog-title");
const dialogPrice = document.getElementById("dialog-price");
const dialogStatus = document.getElementById("dialog-status");
const dialogCondition = document.getElementById("dialog-condition");
const dialogDimensions = document.getElementById("dialog-dimensions");
const dialogDescription = document.getElementById("dialog-description");
const dialogLink = document.getElementById("dialog-link");
const dialogWhatsapp = document.getElementById("dialog-whatsapp");
const toastEl = document.getElementById("toast");

/** @type {Array<any>} */
let products = [];
let currentProduct = null;
let currentImageIndex = 0;
let ignoreHashChange = false;
let toastTimer = null;

function formatPrice(price) {
  return priceFormatter.format(price);
}

function whatsappUrl(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function statusBadgeClass(status) {
  if (status === "reservado") return "badge-reservado";
  if (status === "vendido") return "badge-vendido";
  return "badge-disponible";
}

function truncate(text, max = 80) {
  if (!text || text.length <= max) return text || "";
  return `${text.slice(0, max).trim()}…`;
}

function productUrl(productId) {
  const url = new URL(location.href);
  url.hash = productId;
  return url.toString();
}

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("is-visible");
  }, 2000);
}

async function copyProductLink(productId, button) {
  const url = productUrl(productId);
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const input = document.createElement("input");
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  showToast("Enlace copiado");
  if (button) {
    button.classList.add("is-copied");
    button.setAttribute("aria-label", "Enlace copiado");
    setTimeout(() => {
      button.classList.remove("is-copied");
      button.setAttribute("aria-label", "Compartir enlace");
    }, 1600);
  }
}

function renderGrid() {
  gridEl.innerHTML = "";

  products.forEach((product, index) => {
    const sold = product.status === "vendido";
    const reserved = product.status === "reservado";
    const stateClass = sold ? "card-sold" : reserved ? "card-reservado" : "";
    const card = document.createElement("article");
    card.className = `product-card group relative overflow-hidden rounded-xl bg-neutral-200 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-lg hover:ring-black/10 ${stateClass}`;
    card.style.animationDelay = `${index * 60}ms`;
    card.dataset.id = product.id;

    const cover = product.images[0];
    const eager = index < 4;

    card.innerHTML = `
      <button
        type="button"
        class="share-btn absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm transition hover:bg-white hover:scale-105 active:scale-95"
        aria-label="Compartir enlace"
        data-share="${product.id}"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
      <button
        type="button"
        class="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        aria-label="Ver más sobre ${product.name}"
        data-open="${product.id}"
      >
        <div class="relative aspect-[3/4] overflow-hidden">
          <img
            src="${cover}"
            alt="${product.name}"
            width="1920"
            height="2560"
            class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}
            decoding="async"
          />
          ${
            product.status !== "disponible"
              ? `<span class="status-badge absolute left-2 top-2 z-10 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-md ring-1 ring-black/5 ${statusBadgeClass(product.status)}">${STATUS_LABELS[product.status] || product.status}</span>`
              : ""
          }
          <div class="card-overlay absolute inset-x-0 bottom-0 flex flex-col justify-end p-3 pt-16 text-white md:p-4">
            <h2 class="text-sm font-semibold leading-tight md:text-base">${product.name}</h2>
            <p class="mt-0.5 text-sm text-white/90 md:text-[0.95rem]">${formatPrice(product.price)}</p>
            <div class="card-details">
              <p class="text-xs leading-snug text-white/80 md:text-sm">${truncate(product.description)}</p>
              <span class="mt-2 inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-neutral-900 shadow-sm transition group-hover:bg-white">
                Ver más
              </span>
            </div>
          </div>
        </div>
      </button>
    `;

    gridEl.appendChild(card);
  });

  observeCards();
}

function observeCards() {
  const cards = gridEl.querySelectorAll(".product-card");
  if (!("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  cards.forEach((card) => observer.observe(card));
}

function setGalleryIndex(index, { scroll = true } = {}) {
  if (!currentProduct) return;
  const total = currentProduct.images.length;
  currentImageIndex = ((index % total) + total) % total;

  if (scroll) {
    const slide = galleryTrack.children[currentImageIndex];
    if (slide) {
      slide.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }

  galleryThumbs.querySelectorAll(".gallery-thumb").forEach((thumb, i) => {
    thumb.classList.toggle("is-active", i === currentImageIndex);
  });

  const showNav = total > 1;
  galleryPrev.hidden = !showNav;
  galleryNext.hidden = !showNav;
}

function buildGallery(product) {
  galleryTrack.innerHTML = "";
  galleryThumbs.innerHTML = "";
  currentImageIndex = 0;

  product.images.forEach((src, i) => {
    const slide = document.createElement("div");
    slide.className = "gallery-slide h-full";
    slide.innerHTML = `
      <img
        src="${src}"
        alt="${product.name} — foto ${i + 1}"
        width="1920"
        height="2560"
        ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
        decoding="async"
      />
    `;
    galleryTrack.appendChild(slide);

    const thumb = document.createElement("img");
    thumb.className = `gallery-thumb ${i === 0 ? "is-active" : ""}`;
    thumb.src = src;
    thumb.alt = "";
    thumb.width = 72;
    thumb.height = 72;
    thumb.loading = "lazy";
    thumb.decoding = "async";
    thumb.addEventListener("click", () => setGalleryIndex(i));
    galleryThumbs.appendChild(thumb);
  });

  setGalleryIndex(0, { scroll: false });
  galleryTrack.scrollLeft = 0;
}

function centerGallery() {
  galleryTrack.scrollLeft = 0;
  const first = galleryTrack.children[0];
  if (first) {
    first.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: "nearest",
    });
  }
}

function openProduct(product, { updateHash = true } = {}) {
  currentProduct = product;

  dialogTitle.textContent = product.name;
  dialogPrice.textContent = formatPrice(product.price);
  dialogCondition.textContent = product.condition || "—";
  dialogDimensions.textContent = product.dimensions || "—";
  dialogDescription.textContent = product.description || "";

  const status = product.status || "disponible";
  dialogStatus.textContent = STATUS_LABELS[status] || status;
  dialogStatus.className = `inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`;

  if (product.link) {
    dialogLink.href = product.link;
    dialogLink.hidden = false;
  } else {
    dialogLink.hidden = true;
  }

  dialogWhatsapp.href = whatsappUrl(
    `Hola! Estoy interesado en ${product.name}`
  );

  buildGallery(product);

  if (!dialogEl.open) {
    dialogEl.showModal();
  }

  // After layout, center the first image in the gallery viewport
  requestAnimationFrame(() => {
    centerGallery();
    requestAnimationFrame(centerGallery);
  });

  if (updateHash) {
    ignoreHashChange = true;
    history.replaceState(null, "", `#${product.id}`);
    queueMicrotask(() => {
      ignoreHashChange = false;
    });
  }
}

function closeProduct({ updateHash = true } = {}) {
  if (dialogEl.open) {
    dialogEl.close();
  }
  currentProduct = null;

  if (updateHash && location.hash) {
    ignoreHashChange = true;
    history.replaceState(null, "", location.pathname + location.search);
    queueMicrotask(() => {
      ignoreHashChange = false;
    });
  }
}

function productIdFromUrl() {
  const fromHash = decodeURIComponent(location.hash.replace(/^#/, "")).trim();
  if (fromHash) return fromHash;

  const fromQuery = new URLSearchParams(location.search).get("product");
  return fromQuery ? fromQuery.trim() : "";
}

function openFromUrl() {
  const id = productIdFromUrl();
  if (!id) {
    if (dialogEl.open) closeProduct({ updateHash: false });
    return;
  }
  const product = products.find((p) => p.id === id);
  if (product) {
    openProduct(product, { updateHash: false });
  }
}

function syncGalleryFromScroll() {
  if (!currentProduct || !galleryTrack.children.length) return;
  const width = galleryTrack.clientWidth;
  if (!width) return;
  const index = Math.round(galleryTrack.scrollLeft / width);
  if (index !== currentImageIndex) {
    setGalleryIndex(index, { scroll: false });
  }
}

function onKeydown(event) {
  if (!dialogEl.open || !currentProduct) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setGalleryIndex(currentImageIndex - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    setGalleryIndex(currentImageIndex + 1);
  }
}

async function init() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    products = await response.json();
  } catch (error) {
    gridEl.innerHTML = `
      <p class="col-span-full rounded-xl bg-red-50 p-6 text-center text-sm text-red-700">
        No se pudieron cargar los productos. Abrí el sitio con un servidor local
        (<code class="font-mono">python3 -m http.server 8000</code>).
      </p>
    `;
    console.error(error);
    return;
  }

  renderGrid();

  gridEl.addEventListener("click", (event) => {
    const shareBtn = event.target.closest("[data-share]");
    if (shareBtn) {
      event.preventDefault();
      event.stopPropagation();
      copyProductLink(shareBtn.dataset.share, shareBtn);
      return;
    }

    const button = event.target.closest("[data-open]");
    if (!button) return;
    const product = products.find((p) => p.id === button.dataset.open);
    if (product) openProduct(product);
  });

  dialogCloseBtn.addEventListener("click", () => closeProduct());

  dialogEl.addEventListener("click", (event) => {
    if (event.target === dialogEl) closeProduct();
  });

  dialogEl.addEventListener("close", () => {
    if (location.hash && !ignoreHashChange) {
      ignoreHashChange = true;
      history.replaceState(null, "", location.pathname + location.search);
      queueMicrotask(() => {
        ignoreHashChange = false;
      });
    }
    currentProduct = null;
  });

  galleryPrev.addEventListener("click", () =>
    setGalleryIndex(currentImageIndex - 1)
  );
  galleryNext.addEventListener("click", () =>
    setGalleryIndex(currentImageIndex + 1)
  );

  galleryTrack.addEventListener("scroll", () => {
    window.requestAnimationFrame(syncGalleryFromScroll);
  });

  document.addEventListener("keydown", onKeydown);

  window.addEventListener("hashchange", () => {
    if (ignoreHashChange) return;
    openFromUrl();
  });

  openFromUrl();
}

init();
