<script setup lang="ts">
import { useId, useTemplateRef, watch } from 'vue'

withDefaults(defineProps<{
  name: string
  title: string
  submitLabel?: string
}>(), {
  submitLabel: 'Submit',
})

defineEmits<{
  submit: [event: SubmitEvent]
}>()

const open = defineModel<boolean>('open', { default: false })
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const headingId = useId()

watch([dialog, open], ([element, isOpen]) => {
  if (!element || element.open === isOpen) return

  if (isOpen) {
    element.showModal()
  } else {
    element.close()
  }
}, { flush: 'post' })

function close() {
  open.value = false
}

function syncClosed() {
  if (!dialog.value?.open) close()
}
</script>

<template>
  <dialog
    :id="name"
    ref="dialog"
    class="modal"
    :aria-labelledby="headingId"
    @close="syncClosed"
  >
    <form class="modal-form" @submit.prevent="$emit('submit', $event)">
      <header class="modal-header">
        <h2 :id="headingId">{{ title }}</h2>
        <button class="modal-close" type="button" aria-label="Close dialog" @click="close">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m6 6 12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
            />
          </svg>
        </button>
      </header>

      <div class="modal-body">
        <slot />
      </div>

      <footer class="modal-footer">
        <button class="modal-button" type="button" @click="close">Cancel</button>
        <button class="modal-button modal-submit" type="submit">{{ submitLabel }}</button>
      </footer>
    </form>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(32rem, calc(100% - 2rem));
  max-height: calc(100dvh - 2rem);
  margin: auto;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 45%);
}

.modal::backdrop {
  background: rgb(0 0 0 / 72%);
}

.modal-form {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-height: inherit;
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-surface-elevated);
}

.modal-header {
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.25;
}

.modal-close,
.modal-button {
  min-height: 2.75rem;
  border-radius: 0.625rem;
  cursor: pointer;
}

.modal-close {
  display: grid;
  flex: 0 0 2.75rem;
  place-items: center;
}

.modal-body {
  overflow: auto;
  overscroll-behavior: contain;
  padding: 1.25rem;
}

.modal-footer {
  flex-wrap: wrap;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
}

.modal-button {
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-weight: 700;
}

.modal-submit {
  border-color: var(--color-secondary);
  background: var(--color-primary);
}

@media (hover: hover) {
  .modal-close:hover,
  .modal-button:hover {
    background: var(--color-background);
  }

  .modal-submit:hover {
    background: var(--color-primary-hover);
  }
}

.modal-close:active,
.modal-button:active {
  background: var(--color-background);
}

.modal-submit:active {
  background: var(--color-primary-pressed);
}

.modal-close:focus-visible,
.modal-button:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 2px;
}
</style>
