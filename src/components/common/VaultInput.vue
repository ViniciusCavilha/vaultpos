<template>
  <label class="vault-field">
    <span v-if="label" class="vault-field__label">{{ label }}</span>
    <span
      class="vault-field__control"
      :class="{
        'is-focused': focused,
        'has-error': Boolean(error),
        'has-success': success && !error,
        'is-disabled': disabled,
      }"
    >
      <ion-icon v-if="icon" class="vault-field__icon vault-field__icon--left" :icon="icon" />
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :class="{ 'has-left-icon': icon, 'has-right-icon': iconRight || success }"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <button
        v-if="iconRight"
        class="vault-field__right-button"
        type="button"
        :disabled="disabled"
        aria-label="Ação do campo"
        @click="emit('right-click')"
      >
        <ion-icon :icon="iconRight" />
      </button>
      <ion-icon
        v-else-if="success && !error"
        class="vault-field__icon vault-field__icon--right vault-field__check"
        :icon="checkmarkCircleOutline"
      />
    </span>
    <span v-if="error" class="vault-field__error">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { checkmarkCircleOutline } from 'ionicons/icons'
import { ref } from 'vue'

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
  autocomplete?: string
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
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
  autocomplete: 'off',
  inputmode: 'text',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'right-click': []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const focused = ref(false)

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function handleFocus(event: FocusEvent) {
  focused.value = true
  emit('focus', event)
}

function handleBlur(event: FocusEvent) {
  focused.value = false
  emit('blur', event)
}
</script>

<style scoped>
.vault-field {
  display: block;
  width: 100%;
  font-family: var(--vault-font-family);
}

.vault-field__label {
  display: block;
  margin-bottom: 6px;
  color: #6B7280;
  font-size: 13px;
  font-weight: 400;
}

.vault-field__control {
  position: relative;
  display: flex;
  width: 100%;
  height: 52px;
  overflow: hidden;
  align-items: center;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: #F8FAFC;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.vault-field__control.is-focused {
  border: 1.5px solid #991B1B;
  background: #FFFFFF;
}

.vault-field__control.has-error {
  border: 1.5px solid #EF4444;
}

.vault-field__control.has-success {
  border: 1.5px solid #22C55E;
}

.vault-field__control.is-disabled {
  cursor: not-allowed;
  opacity: 1;
}

input {
  width: 100%;
  height: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  padding: 0 16px;
  color: #111827;
  font-family: var(--vault-font-family);
  font-size: 14px;
  font-weight: 400;
}

input.has-left-icon {
  padding-left: 44px;
}

input.has-right-icon {
  padding-right: 44px;
}

input::placeholder {
  color: #6B7280;
  opacity: 1;
}

input:disabled {
  cursor: not-allowed;
  color: #111827;
}

input:disabled::placeholder { color: #6B7280; }

.vault-field__icon {
  position: absolute;
  z-index: 1;
  color: #9CA3AF;
  font-size: 18px;
  pointer-events: none;
}

.vault-field__icon--left {
  left: 14px;
}

.vault-field__icon--right {
  right: 14px;
}

.is-focused .vault-field__icon {
  color: #991B1B;
}

.has-error .vault-field__icon {
  color: #EF4444;
}

.has-success .vault-field__icon,
.vault-field__check {
  color: #22C55E;
}

.is-disabled .vault-field__icon {
  color: #6B7280;
}

.vault-field__right-button {
  position: absolute;
  right: 0;
  display: grid;
  width: 44px;
  height: 100%;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: #9CA3AF;
  cursor: pointer;
}

.vault-field__right-button ion-icon {
  font-size: 18px;
}

.vault-field__error {
  display: block;
  margin-top: 4px;
  color: #EF4444;
  font-size: 12px;
  font-weight: 400;
}
</style>
