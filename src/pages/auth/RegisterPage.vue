<template>
  <auth-layout>
    <div class="auth-screen">
      <div class="vault-logo" aria-label="VaultPOS">
        <span class="vault-logo-vault">VAULT</span><span class="vault-logo-pos">POS</span>
      </div>

      <section class="auth-copy">
        <h1>Criar conta</h1>
        <p>Preencha seus dados</p>
      </section>

      <form class="auth-form" @submit.prevent="handleRegister">
        <vault-input
          v-model="form.name"
          label="Nome completo"
          autocomplete="name"
          placeholder="Seu nome completo"
          :icon="personOutline"
          :error="fieldError('name')"
          :success="isSuccess('name')"
          :disabled="authStore.loading"
          @blur="touch('name')"
        />

        <vault-input
          v-model="form.email"
          label="E-mail"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="seu@email.com"
          :icon="mailOutline"
          :error="fieldError('email')"
          :success="isSuccess('email')"
          :disabled="authStore.loading || isGoogleRegistration"
          @blur="touch('email')"
        />

        <vault-input
          v-model="form.phone"
          label="Telefone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="(11) 99999-9999"
          :icon="callOutline"
          :error="fieldError('phone')"
          :success="isSuccess('phone')"
          :disabled="authStore.loading"
          @blur="touch('phone')"
        />


        <fieldset class="role-field">
          <legend>Cargo</legend>
          <div class="role-options">
            <button
              type="button"
              :class="{ active: form.role === 'garcom' }"
              :disabled="authStore.loading"
              @click="form.role = 'garcom'"
            >
              Garçom
            </button>
            <button
              type="button"
              :class="{ active: form.role === 'admin' }"
              :disabled="authStore.loading"
              @click="form.role = 'admin'"
            >
              Administrador
            </button>
          </div>
          <span v-if="fieldError('role')" class="field-error">{{ fieldError('role') }}</span>
        </fieldset>
        <vault-input
          v-if="!isGoogleRegistration"
          v-model="form.password"
          label="Senha"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Mínimo 8 caracteres"
          :icon="lockClosedOutline"
          :icon-right="showPassword ? eyeOffOutline : eyeOutline"
          :error="fieldError('password')"
          :success="isSuccess('password')"
          :disabled="authStore.loading"
          @blur="touch('password')"
          @right-click="showPassword = !showPassword"
        />

        <vault-input
          v-if="!isGoogleRegistration"
          v-model="form.confirmPassword"
          label="Confirmar senha"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Repita a senha"
          :icon="lockClosedOutline"
          :icon-right="showConfirmPassword ? eyeOffOutline : eyeOutline"
          :error="fieldError('confirmPassword')"
          :success="isSuccess('confirmPassword')"
          :disabled="authStore.loading"
          @blur="touch('confirmPassword')"
          @right-click="showConfirmPassword = !showConfirmPassword"
        />

        <vault-button
          class="register-button"
          :label="isGoogleRegistration ? 'Concluir cadastro' : 'Criar conta'"
          :loading-label="isGoogleRegistration ? 'Concluindo...' : 'Criando conta...'"
          :loading="authStore.loading"
          :disabled="!formValid"
          @click="handleRegister"
        />
      </form>

      <footer class="auth-footer">
        <span>Já tenho conta? </span>
        <button type="button" @click="goToLogin">Entrar</button>
      </footer>
    </div>
  </auth-layout>
</template>

<script setup lang="ts">
import {
  callOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
} from 'ionicons/icons'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultInput from '@/components/common/VaultInput.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth.store'

type FieldName = 'name' | 'email' | 'phone' | 'role' | 'password' | 'confirmPassword'
type Role = 'admin' | 'garcom'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { showToast } = useVaultToast()
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const touched = reactive<Record<FieldName, boolean>>({
  name: false,
  email: false,
  phone: false,
  role: false,
  password: false,
  confirmPassword: false,
})
const form = reactive({
  name: '',
  email: '',
  phone: '',
  role: 'garcom' as Role,
  password: '',
  confirmPassword: '',
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const googleNamePattern = /^[\p{L} ]+$/u
const isGoogleRegistration = computed(() => route.query.google === '1' && Boolean(authStore.userEmail))

function validate(field: FieldName) {
  if (isGoogleRegistration.value && (field === 'password' || field === 'confirmPassword')) return ''
  const value = form[field].trim()
  if (!value) return 'Campo obrigatório'
  if (field === 'email' && !emailPattern.test(value)) return 'E-mail inválido'
  if (field === 'phone' && onlyDigits(value).length < 10) return 'Telefone inválido'
  if (field === 'role' && form.role !== 'admin' && form.role !== 'garcom') return 'Selecione um cargo'
  if (field === 'password' && form.password.length < 8) return 'A senha deve ter no mínimo 8 caracteres'
  if (field === 'confirmPassword' && form.confirmPassword !== form.password) return 'As senhas não coincidem'
  return ''
}

function onlyDigits(value: string) { return value.replace(/\D/g, '') }

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function fieldError(field: FieldName) {
  return touched[field] ? validate(field) : ''
}

function isSuccess(field: FieldName) {
  return touched[field] && !validate(field)
}

function touch(field: FieldName) {
  touched[field] = true
}

const formValid = computed(() =>
  (Object.keys(touched) as FieldName[]).every((field) => !validate(field)),
)

async function goToLogin() {
  await router.replace('/login')
}

async function handleRegister() {
  const fields = Object.keys(touched) as FieldName[]
  fields.forEach(touch)
  if (!formValid.value || authStore.loading) return

  try {
    if (isGoogleRegistration.value) {
      await authStore.completeGoogleRegistration({
        full_name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
      })
    } else {
      await authStore.register(form.email.trim(), form.password, {
        full_name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
      })
    }
    await showToast(isGoogleRegistration.value ? 'Cadastro concluído com sucesso!' : 'Conta criada com sucesso!', 'success')
    await router.replace(form.role === 'admin' ? '/admin/dashboard' : '/garcom/dashboard')
  } catch (error) {
    await showToast(authStore.error || (error instanceof Error ? error.message : 'Não foi possível criar a conta.'), 'error')
  }
}

onMounted(() => {
  if (!isGoogleRegistration.value) return

  const googleName = (authStore.user?.displayName || '').trim().replace(/\s+/g, ' ')
  form.name = googleName && googleNamePattern.test(googleName) ? googleName : ''
  form.email = authStore.userEmail || ''
  form.phone = formatPhone(authStore.user?.phoneNumber || '')
  touched.name = Boolean(form.name)
  touched.email = Boolean(form.email)
})

watch(() => form.phone, (value) => {
  const formatted = formatPhone(value)
  if (formatted !== value) form.phone = formatted
})
</script>

<style scoped>
.auth-screen {
  min-height: 100%;
  padding: 48px 24px 96px;
  background: #FFFFFF;
}

.vault-logo { text-align: center; font-size: 22px; letter-spacing: 2px; }
.vault-logo-vault { color: #991B1B; font-weight: 800; }
.vault-logo-pos { color: #111827; font-weight: 800; }
.auth-copy { margin-top: 32px; }
.auth-copy h1 { margin: 0; color: #111827; font-size: 28px; font-weight: 700; line-height: 1.2; }
.auth-copy p { margin: 6px 0 0; color: #6B7280; font-size: 14px; }
.auth-form { display: grid; gap: 16px; margin-top: 24px; }
.role-field { margin: 0; border: 0; padding: 0; }
.role-field legend { margin-bottom: 6px; color: #6B7280; font-size: 13px; }
.role-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.role-options button { height: 48px; border: 1px solid #E5E7EB; border-radius: 10px; background: #F8FAFC; color: #6B7280; font-family: Inter, sans-serif; font-size: 14px; font-weight: 600; }
.role-options button.active { border-color: #991B1B; background: #FEF2F2; color: #991B1B; }
.role-options button:disabled { cursor: not-allowed; opacity: .8; }
.field-error { display: block; margin-top: 4px; color: #EF4444; font-size: 12px; }
.register-button { margin-top: 8px; }

.auth-footer {
  position: fixed;
  right: 24px;
  bottom: 32px;
  left: 24px;
  color: #6B7280;
  font-size: 14px;
  text-align: center;
}

.auth-footer button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #991B1B;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
}

@media (min-width: 640px) {
  .auth-screen { width: 440px; margin: 0 auto; }
}

@media (max-height: 800px) {
  .auth-footer { position: static; margin-top: 28px; }
}
</style>
