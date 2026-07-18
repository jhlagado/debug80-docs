import { defineComponent, h, nextTick, watch } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { inBrowser, useRoute } from 'vitepress';
import { enhancePage } from './page-enhancements.js';
import './custom.css';

/** Each book is its own illuminated volume; the accent follows the route. */
const BOOK_BY_PREFIX: readonly (readonly [string, string])[] = [
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
    return () => h(DefaultTheme.Layout);
  },
});

export default {
  extends: DefaultTheme,
  Layout,
};
