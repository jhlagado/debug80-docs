<script setup lang="ts">
/**
 * The three marks, at any size.
 *
 * One construction: a square body at the stroke weight of the schematic
 * figures, with a single accent inside. The accent takes `--mark-accent`,
 * falling back to the book's `--signal`, so a mark placed on a coloured card
 * can be told which colour to use.
 *
 * Nothing here depends on a font. The "80" is drawn as geometry — two stacked
 * rounded rectangles and one tall one — because text in an SVG resolves to
 * whatever monospace face the machine has, which is why the same mark rendered
 * at three different sizes used to look like three different marks: bloated at
 * 128px, an unreadable smudge at 20px. Geometry scales exactly.
 *
 * Glimmer is a lit pixel with four rays, not a star. The obvious drawing for
 * "glimmer" is a four-point sparkle, but that is Gemini's logo almost exactly,
 * so it is out however well it fits. A lit pixel is the better idea anyway:
 * Glimmer draws games on a dot-matrix display, and one dot coming on is what
 * the name describes.
 */
withDefaults(defineProps<{ book?: 'debug80' | 'azm' | 'glimmer'; size?: number | string }>(), {
  book: 'debug80',
  size: 24,
});

const LABEL = { debug80: 'Debug80', azm: 'AZM', glimmer: 'Glimmer' };
</script>

<template>
  <svg
    class="mark"
    :class="`mark--${book}`"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    role="img"
    :aria-label="LABEL[book]"
  >
    <template v-if="book === 'debug80'">
      <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square">
        <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="1.2" />
        <path d="M2.4 9H5.2M2.4 12H5.2M2.4 15H5.2" />
        <path d="M18.8 9H21.6M18.8 12H21.6M18.8 15H21.6" />
        <path d="M9 2.4V5.2M12 2.4V5.2M15 2.4V5.2" />
        <path d="M9 18.8V21.6M12 18.8V21.6M15 18.8V21.6" />
      </g>
      <g class="mark__accent" fill="none" stroke-width="1.35">
        <rect x="8.1" y="8.8" width="3.2" height="3.0" rx="1.4" />
        <rect x="8.1" y="11.8" width="3.2" height="3.4" rx="1.6" />
        <rect x="12.7" y="8.8" width="3.2" height="6.4" rx="1.6" />
      </g>
    </template>

    <template v-else-if="book === 'azm'">
      <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square">
        <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="1.2" />
      </g>
      <path
        class="mark__accent"
        fill="none"
        stroke-width="1.7"
        stroke-linecap="square"
        d="M8.4 8.6H15.6L8.4 15.4H15.6"
      />
    </template>

    <template v-else>
      <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square">
        <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="1.2" />
      </g>
      <g class="mark__accent" fill="none" stroke-width="1.6" stroke-linecap="round">
        <path d="M12 6.4V8" />
        <path d="M12 16V17.6" />
        <path d="M6.4 12H8" />
        <path d="M16 12H17.6" />
      </g>
      <rect class="mark__accent--filled" x="10" y="10" width="4" height="4" rx="0.4" />
    </template>
  </svg>
</template>
