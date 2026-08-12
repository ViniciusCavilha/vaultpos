<template>
  <section class="vault-empty-state">
    <div class="vault-empty-state__icon" aria-hidden="true">
      <ion-icon :name="icon" />
    </div>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <vault-button
      v-if="buttonText"
      class="vault-empty-state__button"
      variant="outline"
      :label="buttonText"
      @click="action"
    />
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import VaultButton from '@/components/common/VaultButton.vue'

const props = withDefaults(defineProps<{
  icon: string
  title: string
  message: string
  buttonText?: string | null
  onAction?: () => void | Promise<void>
}>(), {
  buttonText: null,
  onAction: undefined,
})

const emit = defineEmits<{ action: [] }>()

function action() {
  emit('action')
  void props.onAction?.()
}
</script>

<style scoped>
.vault-empty-state {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  margin: 12px 0;
  border-radius: 16px;
  padding: 32px 24px;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.vault-empty-state__icon {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: 50%;
  background: #F3F4F6;
  color: #9CA3AF;
}

.vault-empty-state__icon ion-icon { font-size: 32px; }

h2 {
  margin: 16px 0 0;
  color: #111827;
  font-size: 18px;
  font-weight: 600;
}

p {
  max-width: 260px;
  margin: 6px auto 0;
  color: #6B7280;
  font-size: 14px;
  line-height: 1.5;
}

.vault-empty-state__button {
  width: 100%;
  max-width: 320px;
  margin-top: 20px;
}
</style>
