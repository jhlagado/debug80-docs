import { defineConfig } from 'vitepress';
import { sidebars } from './sidebar.generated.js';

export default defineConfig({
  title: 'Debug80 Docs',
  description:
    'Technical documentation for the Debug80 Z80 debugger extension and the AZM assembler',
  srcDir: '.',
  srcExclude: [
    '_internal/**',
    '01-basic-operation.md',
    'README.md',
    'lanternfly-book/rewrite/**',
  ],

  // Jekyll published every page as /path/page.html; keeping .html URLs
  // preserves all 120 live URLs verbatim.
  cleanUrls: false,

  sitemap: {
    hostname: 'https://debug80.com',
    transformItems(items) {
      return items.filter((item) => !item.url.startsWith('tec1g/'));
    },
  },

  // The Manuscript scheme is a deliberate light design, matching the
  // Jekyll site exactly; no dark mode toggle.
  appearance: false,

  markdown: {
    // The books fence Z80 listings as ```z80; Shiki has no Z80 grammar, so
    // reuse the generic assembler grammar rather than falling back to txt.
    languageAlias: { z80: 'asm' },
    // Warm-toned dark syntax theme to match the Nocturne palette.
    theme: 'github-light',
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap',
      },
    ],
  ],

  themeConfig: {
    nav: [
      // Straight to the first page of each single-book series. Lanternfly has
      // two books, so its menu exposes both without an intermediate landing
      // page. The index pages still exist for direct URLs.
      { text: 'Debug80 Book', link: '/debug80-book/book1/01-install-debug80' },
      { text: 'AZM Books', link: '/azm-book/book1/00-introduction' },
      { text: 'Glimmer Books', link: '/glimmer-book/book1/00-introduction' },
      {
        text: 'Lanternfly Books',
        items: [
          {
            text: 'Book 1 — Programming Fundamentals',
            link: '/lanternfly-book/book1/00-introduction',
          },
          {
            text: 'Book 2 — Language Reference',
            link: '/lanternfly-book/book2/',
          },
        ],
      },
    ],
    sidebar: sidebars,
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/jhlagado/debug80' }],
    outline: { level: [2, 3] },
  },

  // Until the kramdown-era relative links are audited, do not fail the build.
  ignoreDeadLinks: true,

  // The corpus carries Jekyll front matter (`layout: default` / `layout: home`),
  // which VitePress would treat as unknown layout components. Normalize to the
  // standard doc layout instead of rewriting 129 files.
  transformPageData(pageData) {
    const layout = pageData.frontmatter.layout;
    if (layout === 'default' || layout === 'home') {
      delete pageData.frontmatter.layout;
    }
    if (pageData.relativePath.startsWith('tec1g/')) {
      pageData.frontmatter.search = false;
    }
  },
});
