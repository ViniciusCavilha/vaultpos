<template>
  <div class="empty-state">
    <div class="empty-state__icon"><ion-icon :icon="resolvedIcon" /></div>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <VaultButton
      v-if="buttonText"
      class="empty-state__button"
      variant="outline"
      :label="buttonText"
      @click="action"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  bagOutline,
  cardOutline,
  cubeOutline,
  peopleOutline,
  personOutline,
  receiptOutline,
} from 'ionicons/icons'
import VaultButton from '@/components/common/VaultButton.vue'

const props = withDefaults(defineProps<{
  icon?: string
  title: string
  message: string
  buttonText?: string | null
  onAction?: () => void
}>(), {
  icon: 'receipt-outline',
  buttonText: null,
  onAction: undefined,
})
const emit = defineEmits<{ action: [] }>()
const icons: Record<string, string> = {
  'bag-outline': bagOutline,
  'card-outline': cardOutline,
  'cube-outline': cubeOutline,
  'people-outline': peopleOutline,
  'person-outline': personOutline,
  'receipt-outline': receiptOutline,
}
const resolvedIcon = computed(() => icons[props.icon] ?? receiptOutline)
function action() {
  props.onAction?.()
  emit('action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 12px 0;
  padding: 32px 24px;
  border-radius: 16px;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  text-align: center;
}
.empty-state__icon {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: 50%;
  background: #F3F4F6;
  color: #9CA3AF;
}
.empty-state__icon ion-icon { width: 32px; height: 32px; }
h2 { margin: 16px 0 0; color: #111827; font-size: 18px; font-weight: 600; letter-spacing: 0; }
p { max-width: 260px; margin: 6px auto 0; color: #6B7280; font-size: 14px; line-height: 1.5; }
.empty-state__button { max-width: 320px; margin-top: 20px; }
</style>
