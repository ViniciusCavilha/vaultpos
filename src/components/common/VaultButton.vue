<template>
  <button
    class="vault-button"
    :class="'vault-button--' + variant"
    :disabled="disabled || loading"
    type="button"
    @click="emit('click')"
  >
    <span v-if="loading" class="vault-button__spinner" aria-hidden="true"></span>
    <span>{{ loading ? loadingLabel : label }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  loading?: boolean
  disabled?: boolean
  label: string
  loadingLabel?: string
}>(), {
  variant: 'primary',
  loading: false,
  disabled: false,
  loadingLabel: 'Aguarde...',
})

const emit = defineEmits<{ click: [] }>()
</script>

<style scoped>
.vault-button {
  display: inline-flex;
  width: 100%;
  height: 52px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
  cursor: pointer;
  transition: background-color 150ms ease, opacity 150ms ease;
}
.vault-button:disabled { cursor: not-allowed; opacity: 0.6; }
.vault-button--primary { background: #991B1B; color: #FFFFFF; }
.vault-button--primary:active:not(:disabled) { background: #7F1D1D; }
.vault-button--secondary { border: 1px solid #E5E7EB; background: #FFFFFF; color: #111827; }
.vault-button--secondary:active:not(:disabled) { background: #F3F4F6; }
.vault-button--outline { border: 1.5px solid #991B1B; background: #FFFFFF; color: #991B1B; font-size: 15px; }
.vault-button--ghost { height: auto; background: transparent; color: #991B1B; font-size: 15px; }
.vault-button--destructive { background: #EF4444; color: #FFFFFF; }
.vault-button--destructive:active:not(:disabled) { background: #DC2626; }
.vault-button__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: vault-spin 700ms linear infinite;
}
@keyframes vault-spin { to { transform: rotate(360deg); } }
</style>
