<template>
  <ion-button
    class="vault-button"
    :class="`vault-button--${variant}`"
    expand="block"
    :disabled="disabled || loading"
    @click="emit('click')"
  >
    <span v-if="loading" class="vault-button__spinner" aria-hidden="true" />
    <span>{{ loading ? loadingLabel : label }}</span>
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue'

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
  width: 100%;
  height: 52px;
  margin: 0;
  --border-radius: 12px;
  --box-shadow: none;
  font-family: var(--vault-font-family);
  font-size: 16px;
  font-weight: 600;
  text-transform: none;
}

.vault-button--primary {
  --background: #991B1B;
  --background-activated: #7F1D1D;
  --background-hover: #991B1B;
  --color: #FFFFFF;
  --border-width: 0;
}

.vault-button--secondary {
  --background: #FFFFFF;
  --background-activated: #F3F4F6;
  --background-hover: #FFFFFF;
  --color: #111827;
  --border-color: #E5E7EB;
  --border-style: solid;
  --border-width: 1px;
}

.vault-button--outline {
  --background: #FFFFFF;
  --background-activated: #FEF2F2;
  --background-hover: #FFFFFF;
  --color: #991B1B;
  --border-color: #991B1B;
  --border-style: solid;
  --border-width: 1.5px;
  font-size: 15px;
}

.vault-button--ghost {
  --background: transparent;
  --background-activated: #FEF2F2;
  --background-hover: transparent;
  --color: #991B1B;
  --border-width: 0;
  font-size: 15px;
}

.vault-button--destructive {
  --background: #EF4444;
  --background-activated: #DC2626;
  --background-hover: #EF4444;
  --color: #FFFFFF;
  --border-width: 0;
}

.vault-button.button-disabled {
  --background: #E5E7EB;
  --color: #9CA3AF;
  opacity: 1;
}

.vault-button__spinner {
  width: 16px;
  height: 16px;
  margin-right: 9px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: vault-spin 700ms linear infinite;
}

@keyframes vault-spin {
  to { transform: rotate(360deg); }
}
</style>
