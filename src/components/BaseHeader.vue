<script setup lang="ts">
import brandLogo from '@/assets/images/logo.svg'
import BackButton from '@/components/BackButton.vue'

defineProps<{ title?: string, menu?: boolean }>()
defineEmits<{ options: [] }>()
</script>

<template>
  <header class="header">
    <div v-if="title" class="tool-heading">
      <BackButton arrow class="header-back" />
      <h1>{{ title }}</h1>
      <button
        v-if="menu"
        type="button"
        class="header-extra"
        :aria-label="`${title} options`"
        @click="$emit('options')"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>
    </div>
    <div v-else class="brand">
      <img :src="brandLogo" class="brand-logo" alt="R" />
      <span class="brand-wordmark">oll Playr</span>
    </div>
  </header>
</template>

<style scoped>
  .brand {
    display: flex;
    align-items: flex-end;
    padding: 1rem;
  }

  .brand-logo {
    flex: none;
    width: clamp(3.25rem, 9vw, 4rem);
    aspect-ratio: 1;
  }

  .brand-wordmark {
    /* Align the text baseline with the R inside the circular logo. */
    padding-bottom: 0.16em;
    font-size: clamp(1.75rem, 5vw, 2.25rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1;
    white-space: nowrap;
  }

  .tool-heading {
    --header-inset: clamp(1rem, 4vw, 2rem);
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 1rem var(--header-inset);
    padding-inline-start: calc(var(--header-inset) + max(0px, (100% - 56rem) / 2));
  }

  .tool-heading h1 {
    font-size: clamp(1.5rem, 5vw, 2rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.2;
  }

  .header-back,
  .header-extra {
    display: grid;
    flex: 0 0 2.75rem;
    min-height: 2.75rem;
    place-items: center;
    border-radius: 0.625rem;
  }

  .header-back {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .header-extra {
    margin-inline-start: auto;
    cursor: pointer;
  }

  @media (hover: hover) {
    .header-extra:enabled:hover {
      background: var(--color-surface);
    }
  }

  .header-extra:enabled:active {
    background: var(--color-background);
  }

  .header-extra:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .header-back:hover {
    border-color: var(--color-secondary);
    background: var(--color-primary-pressed);
  }

  .header-back:focus-visible,
  .header-extra:focus-visible {
    outline: 2px solid #c4b5fd;
    outline-offset: 2px;
  }

  .header {
    position: relative;
    overflow: hidden;
    background: linear-gradient(
      135deg,
      #0F0B17 0%,
      #241A38 50%,
      #5B21B6 100%
    );
    border-bottom: 2px solid var(--color-border);
  }

  .header::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      120deg,
      transparent 0%,
      rgba(139, 92, 246, 0.15) 35%,
      rgba(139, 92, 246, 0.65) 50%,
      rgba(139, 92, 246, 0.15) 65%,
      transparent 100%
    );
    transform: translateX(-100%);
    animation: shimmer 4s ease-out forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .header::after {
      animation: none;
    }
  }

  @keyframes shimmer {
    from {
      transform: translateX(-100%);
    }

    to {
      transform: translateX(100%);
    }
  }

</style>
