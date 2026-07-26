<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vitepress';

/**
 * The masthead mark, chosen by which book you are reading.
 *
 * All three share one construction — a square body at the same stroke weight
 * as the schematic figures, with a single accent glyph inside — so they read
 * as one family. The accent is `var(--signal)`, which the theme already
 * switches per book, so each mark picks up its own colour without being told.
 *
 * Rendered inline rather than through VitePress's `logo` option, because that
 * option takes one image for the whole site and cannot vary by route.
 */
const route = useRoute();

const book = computed(() => {
  const p = route.path;
  if (p.startsWith('/azm-book/')) return 'azm';
  if (p.startsWith('/glimmer-book/')) return 'glimmer';
  return 'debug80';
});

const label = computed(
  () => ({ debug80: 'Debug80', azm: 'AZM', glimmer: 'Glimmer' })[book.value],
);
</script>

<template>
  <svg class="book-mark" viewBox="0 0 24 24" role="img" :aria-label="label">
    <!-- Debug80: a DIP chip, pins on all four sides. The hardware. -->
    <template v-if="book === 'debug80'">
      <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square">
        <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="1.2" />
        <path d="M2.4 9H5.2M2.4 12H5.2M2.4 15H5.2" />
        <path d="M18.8 9H21.6M18.8 12H21.6M18.8 15H21.6" />
        <path d="M9 2.4V5.2M12 2.4V5.2M15 2.4V5.2" />
        <path d="M9 18.8V21.6M12 18.8V21.6M15 18.8V21.6" />
      </g>
      <text x="12" y="15.1" text-anchor="middle" font-size="8" font-weight="700">80</text>
    </template>

    <!-- AZM: a plate stamped with a Z. No pins: it is a tool, not a part. -->
    <template v-else-if="book === 'azm'">
      <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square">
        <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="1.2" />
      </g>
      <path class="mark-accent-stroke" d="M8.4 8.6H15.6L8.4 15.4H15.6" />
    </template>

    <!-- Glimmer: a light inside the frame. -->
    <template v-else>
      <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square">
        <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="1.2" />
      </g>
      <path
        d="M12 6.4C12 10 13.9 12 17.6 12C13.9 12 12 14 12 17.6C12 14 10.1 12 6.4 12C10.1 12 12 10 12 6.4Z"
      />
    </template>
  </svg>
</template>
