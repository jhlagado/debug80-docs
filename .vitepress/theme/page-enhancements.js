// Client-side page enhancements ported from the Jekyll head_custom.html:
// mermaid diagram rendering and the image lightbox. VitePress navigates as
// an SPA, so these run after every route change (idempotently), not just on
// initial page load.

let lightboxSingleton = null;

export async function enhancePage() {
  renderMermaid();
  bindLightboxImages();
}

async function renderMermaid() {
  const blocks = document.querySelectorAll(
    'div.language-mermaid pre > code, pre > code.language-mermaid',
  );
  if (blocks.length === 0) return;
  const { default: mermaid } = await import(
    'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'
  );
  mermaid.initialize({ startOnLoad: false, theme: 'default' });
  blocks.forEach((el) => {
    const wrapper = el.closest('div.language-mermaid') ?? el.parentElement;
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = el.textContent;
    wrapper.replaceWith(div);
  });
  mermaid.run();
}

function ensureLightbox() {
  if (lightboxSingleton) return lightboxSingleton;

  const lightbox = document.createElement('div');
  lightbox.className = 'image-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image preview');
  lightbox.hidden = true;
  lightbox.innerHTML = [
    '<button class="image-lightbox__close" type="button" aria-label="Close image preview">&times;</button>',
    '<figure class="image-lightbox__figure">',
    '<img class="image-lightbox__image" alt="">',
    '<figcaption class="image-lightbox__caption"></figcaption>',
    '</figure>',
  ].join('');
  document.body.appendChild(lightbox);

  const previewImage = lightbox.querySelector('.image-lightbox__image');
  const caption = lightbox.querySelector('.image-lightbox__caption');
  const closeButton = lightbox.querySelector('.image-lightbox__close');
  let lastFocused = null;
  let previousScrollY = 0;

  function closeLightbox() {
    lightbox.hidden = true;
    document.documentElement.classList.remove('has-image-lightbox');
    document.body.classList.remove('has-image-lightbox');
    document.body.style.top = '';
    previewImage.removeAttribute('src');
    previewImage.alt = '';
    caption.textContent = '';
    if (lastFocused) {
      lastFocused.focus({ preventScroll: true });
      lastFocused = null;
    }
    window.scrollTo({ top: previousScrollY, left: 0, behavior: 'instant' });
  }

  function openLightbox(img) {
    lastFocused = document.activeElement;
    previousScrollY = window.scrollY || window.pageYOffset || 0;
    previewImage.src = img.currentSrc || img.src;
    previewImage.alt = img.alt || '';
    caption.textContent = img.alt || '';
    caption.hidden = !img.alt;
    document.body.style.top = `-${previousScrollY}px`;
    lightbox.hidden = false;
    document.documentElement.classList.add('has-image-lightbox');
    document.body.classList.add('has-image-lightbox');
  }

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (!lightbox.hidden && event.key === 'Escape') closeLightbox();
  });

  lightboxSingleton = { open: openLightbox };
  return lightboxSingleton;
}

function bindLightboxImages() {
  const contentImages = Array.from(document.querySelectorAll('.vp-doc img'));
  if (contentImages.length === 0) return;
  const lightbox = ensureLightbox();

  contentImages.forEach((img) => {
    if (img.closest('a') || img.classList.contains('js-lightbox-image')) return;
    img.classList.add('js-lightbox-image');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute(
      'aria-label',
      img.alt ? `Open image preview: ${img.alt}` : 'Open image preview',
    );
    img.addEventListener('click', () => lightbox.open(img));
    img.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        lightbox.open(img);
      }
    });
  });
}
