<template>
  <label class="vault-field">
    <span v-if="label" class="vault-field__label">{{ label }}</span>
    <span
      class="vault-field__control"
      :class="{ focused, invalid: !!error, valid: success, disabled }"
    >
      <ion-icon v-if="icon" class="vault-field__icon vault-field__icon--left" :icon="icon" />
      <input
        class="vault-field__input"
        :class="{ 'has-left-icon': !!icon, 'has-right-icon': !!iconRight || success }"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @focus="focused = true"
        @blur="onBlur"
      />
      <button
        v-if="iconRight && !success"
        class="vault-field__right-action"
        type="button"
        :disabled="disabled"
        aria-label="Ação do campo"
        @click="emit('right-click')"
      >
        <ion-icon :icon="iconRight" />
      </button>
      <ion-icon
        v-else-if="success"
        class="vault-field__icon vault-field__icon--right"
        :icon="checkmarkCircleOutline"
      />
    </span>
    <span v-if="error" class="vault-field__error">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { checkmarkCircleOutline } from 'ionicons/icons'

withDefaults(defineProps<{
  label?: string
  placeholder?: string
  type?: string
  icon?: string
  iconRight?: string
  disabled?: boolean
  error?: string
  success?: boolean
  modelValue?: string | number
}>(), {
  label: '',
  placeholder: '',
  type: 'text',
  icon: '',
  iconRight: '',
  disabled: false,
  error: '',
  success: false,
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  'right-click': []
}>()
const focused = ref(false)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
function onBlur() {
  focused.value = false
  emit('blur')
}
</script>

<style scoped>
.vault-field { display: block; font-family: 'Inter', sans-serif; }
.vault-field__label { display: block; margin-bottom: 6px; color: #6B7280; font-size: 13px; font-weight: 400; }
.vault-field__control {
  position: relative;
  display: block;
  height: 52px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: #F8FAFC;
  transition: border-color 150ms ease, background-color 150ms ease;
}
.vault-field__control.focused { border: 1.5px solid #991B1B; background: #FFFFFF; }
.vault-field__control.invalid { border: 1.5px solid #EF4444; }
.vault-field__control.valid { border: 1.5px solid #22C55E; }
.vault-field__control.disabled { opacity: 0.6; }
.vault-field__input {
  width: 100%;
  height: 100%;
  padding: 0 16px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #111827;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0;
}
.vault-field__input.has-left-icon { padding-left: 44px; }
.vault-field__input.has-right-icon { padding-right: 44px; }
.vault-field__input::placeholder { color: #D1D5DB; opacity: 1; }
.vault-field__input:disabled { color: #D1D5DB; cursor: not-allowed; }
.vault-field__icon, .vault-field__right-action {
  position: absolute;
  top: 50%;
  z-index: 1;
  width: 18px;
  height: 18px;
  transform: translateY(-50%);
  color: #9CA3AF;
}
.vault-field__icon--left { left: 14px; }
.vault-field__icon--right { right: 14px; color: #22C55E; }
.vault-field__right-action {
  right: 10px;
  display: grid;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
}
.vault-field__right-action ion-icon { width: 18px; height: 18px; }
.focused .vault-field__icon--left { color: #991B1B; }
.invalid .vault-field__icon--left { color: #EF4444; }
.valid .vault-field__icon--left { color: #22C55E; }
.disabled .vault-field__icon { color: #D1D5DB; }
.vault-field__error { display: block; margin-top: 4px; color: #EF4444; font-size: 12px; font-weight: 400; }
</style>
