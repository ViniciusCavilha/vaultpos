<template>
  <AuthLayout>
    <main class="auth-page">
      <div class="vault-logo" aria-label="VAULTPOS">
        <span class="vault-logo-vault">VAULT</span><span class="vault-logo-pos">POS</span>
      </div>

      <section class="auth-content">
        <h1>Criar conta</h1>
        <p class="auth-subtitle">Preencha seus dados</p>

        <form class="auth-form" @submit.prevent="submitRegister">
          <VaultInput
            v-model="form.name"
            label="Nome completo"
            placeholder="Seu nome completo"
            :icon="personOutline"
            :error="errors.name"
            @blur="validateField('name')"
          />
          <VaultInput
            v-model="form.email"
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            :icon="mailOutline"
            :error="errors.email"
            @blur="validateField('email')"
          />
          <VaultInput
            v-model="form.phone"
            label="Telefone"
            type="tel"
            placeholder="(11) 99999-9999"
            :icon="callOutline"
            :error="errors.phone"
            @blur="validateField('phone')"
          />
          <VaultInput
            v-model="form.password"
            label="Senha"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 8 caracteres"
            :icon="lockClosedOutline"
            :icon-right="showPassword ? eyeOffOutline : eyeOutline"
            :error="errors.password"
            @blur="validateField('password')"
            @right-click="showPassword = !showPassword"
          />
          <VaultInput
            v-model="form.confirmPassword"
            label="Confirmar senha"
            :type="showConfirmation ? 'text' : 'password'"
            placeholder="Repita a senha"
            :icon="lockClosedOutline"
            :icon-right="showConfirmation ? eyeOffOutline : eyeOutline"
            :error="errors.confirmPassword"
            @blur="validateField('confirmPassword')"
            @right-click="showConfirmation = !showConfirmation"
          />

          <VaultButton
            class="submit-button"
            label="Criar conta"
            loading-label="Criando conta..."
            :loading="loading"
            @click="submitRegister"
          />
        </form>
      </section>

      <p class="auth-footer">
        Já tenho conta?
        <button type="button" @click="router.push('/login')">Entrar</button>
      </p>
    </main>
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  callOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
} from 'ionicons/icons'
import AuthLayout from '@/layouts/AuthLayout.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultInput from '@/components/common/VaultInput.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { supabase } from '@/supabase/client'

type Field = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword'

const router = useRouter()
const { showToast } = useVaultToast()
const loading = ref(false)
const showPassword = ref(false)
const showConfirmation = ref(false)
const form = reactive({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
const errors = reactive<Record<Field, string>>({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

function validateField(field: Field) {
  const value = form[field].trim()
  errors[field] = ''
  if (!value) errors[field] = 'Campo obrigatório'
  if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.email = 'E-mail inválido'
  }
  if (field === 'password' && value && value.length < 8) {
    errors.password = 'A senha deve ter no mínimo 8 caracteres'
  }
  if (field === 'confirmPassword' && value && value !== form.password) {
    errors.confirmPassword = 'As senhas não coincidem'
  }
}

async function submitRegister() {
  for (const field of Object.keys(errors) as Field[]) validateField(field)
  if (Object.values(errors).some(Boolean) || loading.value) return

  loading.value = true
  try {
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { nome: form.name.trim(), telefone: form.phone.trim() } },
    })
    if (error) throw error
    await showToast('Conta criada com sucesso!', 'success')
    await router.replace('/login')
  } catch (error) {
    await showToast(error instanceof Error ? error.message : 'Não foi possível criar a conta.', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 100%; padding: 1px 24px 92px; background: #FFFFFF; font-family: 'Inter', sans-serif; }
.vault-logo { display: flex; justify-content: center; margin-top: 48px; font-size: 22px; gap: 2px; }
.vault-logo-vault { color: #991B1B; font-weight: 800; }
.vault-logo-pos { color: #111827; font-weight: 800; }
.auth-content { margin-top: 32px; }
h1 { margin: 0; color: #111827; font-size: 28px; font-weight: 700; letter-spacing: 0; }
.auth-subtitle { margin: 6px 0 0; color: #6B7280; font-size: 14px; }
.auth-form { display: grid; gap: 16px; margin-top: 24px; }
.submit-button { margin-top: 8px; }
.auth-footer { position: fixed; right: 24px; bottom: calc(24px + env(safe-area-inset-bottom)); left: 24px; margin: 0; color: #6B7280; font-size: 14px; text-align: center; }
.auth-footer button { padding: 0; border: 0; background: transparent; color: #991B1B; font: 600 14px 'Inter', sans-serif; }
</style>
