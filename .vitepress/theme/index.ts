import { defineComponent, h, nextTick, watch } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { inBrowser, useRoute } from 'vitepress';
import { enhancePage } from './page-enhancements.js';
import './custom.css';

const Layout = defineComponent({
  name: 'Debug80Layout',
  setup() {
    const route = useRoute();
    if (inBrowser) {
      watch(
        () => route.path,
        () => {
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
