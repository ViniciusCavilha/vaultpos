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
          :disabled="authStore.loading"
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

        <vault-input
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
          label="Criar conta"
          loading-label="Criando conta..."
          :loading="authStore.loading"
          :disabled="!formValid"
          @click="handleRegister"
        />
      </form>

      <footer class="auth-footer">
        <span>Já tenho conta? </span>
        <button type="button" @click="router.push('/login')">Entrar</button>
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
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultInput from '@/components/common/VaultInput.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth.store'

type FieldName = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useVaultToast()
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const touched = reactive<Record<FieldName, boolean>>({
  name: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false,
})
const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(field: FieldName) {
  const value = form[field].trim()
  if (!value) return 'Campo obrigatório'
  if (field === 'email' && !emailPattern.test(value)) return 'E-mail inválido'
  if (field === 'password' && form.password.length < 8) return 'A senha deve ter no mínimo 8 caracteres'
  if (field === 'confirmPassword' && form.confirmPassword !== form.password) return 'As senhas não coincidem'
  return ''
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

async function handleRegister() {
  const fields = Object.keys(touched) as FieldName[]
  fields.forEach(touch)
  if (!formValid.value || authStore.loading) return

  try {
    await authStore.register(form.email.trim(), form.password, {
      full_name: form.name.trim(),
      phone: form.phone.trim(),
    })
    await showToast('Conta criada com sucesso!', 'success')
    await router.replace('/garcom/dashboard')
  } catch (error) {
    await showToast(authStore.error || (error instanceof Error ? error.message : 'Não foi possível criar a conta.'), 'error')
  }
}
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
