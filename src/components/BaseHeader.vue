<script setup lang="ts">
import brandLogo from '@/assets/images/logo.svg'
import BackButton from '@/components/BackButton.vue'

defineProps<{ title?: string }>()
</script>

<template>
  <header class="header">
    <div v-if="title" class="tool-heading">
      <BackButton arrow class="header-back" />
      <h1>{{ title }}</h1>
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
    display: flex;
    align-items: center;
    gap: 0.875rem;
    max-width: 56rem;
    margin-inline: auto;
    padding: 1rem clamp(1rem, 4vw, 2rem);
  }

  .tool-heading h1 {
    font-size: clamp(1.5rem, 5vw, 2rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.2;
  }

  .header-back {
    display: grid;
    flex: 0 0 2.75rem;
    min-height: 2.75rem;
    place-items: center;
    border: 1px solid var(--color-border);
    border-radius: 0.625rem;
    background: var(--color-surface);
  }

  .header-back:hover {
    border-color: var(--color-secondary);
    background: var(--color-primary-pressed);
  }

  .header-back:focus-visible {
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
