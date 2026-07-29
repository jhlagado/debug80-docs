import { defineComponent, h, nextTick, watch } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { inBrowser, useRoute } from 'vitepress';
import { enhancePage } from './page-enhancements.js';
import PageEyebrow from './PageEyebrow.vue';
import Mark from './Mark.vue';
import './custom.css';

/** Each book is its own illuminated volume; the accent follows the route. */
const BOOK_BY_PREFIX: readonly (readonly [string, string])[] = [
  ['/lanternfly-book/', 'lanternfly'],
  ['/glimmer-book/', 'glimmer'],
  ['/azm-book/', 'azm'],
  ['/debug80-book/', 'debug80'],
  ['/tec1g/', 'tec1g'],
];

function bookForPath(path: string): string {
  return BOOK_BY_PREFIX.find(([prefix]) => path.startsWith(prefix))?.[1] ?? 'hall';
}

const Layout = defineComponent({
  name: 'Debug80Layout',
  setup() {
    const route = useRoute();
    if (inBrowser) {
      watch(
        () => route.path,
        (path) => {
          document.documentElement.dataset.book = bookForPath(path);
          void nextTick(() => enhancePage());
        },
        { immediate: true },
      );
    }
    return () =>
      h(DefaultTheme.Layout, null, {
        'doc-before': () => h(PageEyebrow),
        // Always the Debug80 chip. The site is Debug80 Docs, so its
        // identity does not change as you move between books; the books
        // carry their own marks on their own pages.
        'nav-bar-title-before': () => h(Mark, { book: 'debug80', size: 20 }),
      });
  },
});

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }: { app: { component: (n: string, c: unknown) => void } }) {
    // Available in markdown, so a book page can show its own mark.
    app.component('Mark', Mark);
  },
};
