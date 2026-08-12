<template>
  <section class="vault-error-state" role="alert">
    <div class="vault-error-state__icon" aria-hidden="true">
      <span>!</span>
    </div>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <vault-button
      v-if="buttonText"
      class="vault-error-state__button"
      variant="outline"
      :label="buttonText"
      @click="retry"
    />
  </section>
</template>

<script setup lang="ts">
import VaultButton from '@/components/common/VaultButton.vue'

const props = withDefaults(defineProps<{
  title?: string
  message?: string
  buttonText?: string
  onRetry?: () => void | Promise<void>
}>(), {
  title: 'Algo deu errado',
  message: 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
  buttonText: 'Tentar novamente',
  onRetry: undefined,
})

const emit = defineEmits<{ retry: [] }>()

function retry() {
  emit('retry')
  void props.onRetry?.()
}
</script>

<style scoped>
.vault-error-state {
  display: flex;
  width: 100%;
  min-height: 360px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto 0;
  padding: 24px;
  text-align: center;
}

.vault-error-state__icon {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: 50%;
  background: #FEF2F2;
}

.vault-error-state__icon span {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 2px solid #EF4444;
  border-radius: 50%;
  color: #EF4444;
  font-size: 20px;
  font-weight: 700;
}

h2 {
  margin: 20px 0 0;
  color: #111827;
  font-size: 18px;
  font-weight: 600;
}

p {
  max-width: 280px;
  margin: 8px auto 0;
  color: #6B7280;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.vault-error-state__button {
  width: 100%;
  max-width: 320px;
  margin-top: 24px;
}
</style>
