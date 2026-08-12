<template>
  <div class="error-state">
    <div class="error-state__icon" aria-hidden="true"><span>!</span></div>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <VaultButton
      v-if="buttonText"
      class="error-state__button"
      variant="outline"
      :label="buttonText"
      @click="retry"
    />
  </div>
</template>

<script setup lang="ts">
import VaultButton from '@/components/common/VaultButton.vue'

const props = withDefaults(defineProps<{
  title?: string
  message?: string
  buttonText?: string
  onRetry?: () => void
}>(), {
  title: 'Algo deu errado',
  message: 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
  buttonText: 'Tentar novamente',
  onRetry: undefined,
})
const emit = defineEmits<{ retry: [] }>()
function retry() {
  props.onRetry?.()
  emit('retry')
}
</script>

<style scoped>
.error-state {
  display: flex;
  min-height: 360px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto;
  padding: 24px;
  text-align: center;
}
.error-state__icon {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: 50%;
  background: #FEF2F2;
}
.error-state__icon span {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 2px solid #EF4444;
  border-radius: 50%;
  color: #EF4444;
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
}
h2 { margin: 20px 0 0; color: #111827; font-size: 18px; font-weight: 600; letter-spacing: 0; }
p { max-width: 280px; margin: 8px auto 0; color: #6B7280; font-size: 14px; line-height: 1.5; }
.error-state__button { max-width: 320px; margin-top: 24px; }
</style>
