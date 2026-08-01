<script setup lang="ts">
  import { ref } from 'vue'
  import brandLogo from '@/assets/images/logo.svg'

  const logo = ref(brandLogo)
</script>

<template>
  <div class="header p-4">
    <img :src="logo" class="h-16"/>
  </div>
</template>

<style scoped>
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

  @keyframes shimmer {
    from {
      transform: translateX(-100%);
    }

    to {
      transform: translateX(100%);
    }
  }

</style>
