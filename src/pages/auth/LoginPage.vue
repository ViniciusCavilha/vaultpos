<template>
  <AuthLayout>
    <main class="auth-page">
      <div class="vault-logo" aria-label="VAULTPOS">
        <span class="vault-logo-vault">VAULT</span><span class="vault-logo-pos">POS</span>
      </div>

      <section class="auth-content">
        <h1>Entrar na sua conta</h1>
        <p class="auth-subtitle">Digite seus dados abaixo</p>

        <form class="auth-form" @submit.prevent="submitLogin">
          <VaultInput
            v-model="email"
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            :icon="mailOutline"
            autocomplete="email"
          />
          <VaultInput
            v-model="password"
            class="password-field"
            label="Senha"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Digite sua senha"
            :icon="lockClosedOutline"
            :icon-right="showPassword ? eyeOffOutline : eyeOutline"
            @right-click="showPassword = !showPassword"
          />

          <button class="forgot-link" type="button" @click="router.push('/forgot-password')">
            Esqueceu a senha?
          </button>

          <VaultButton
            class="login-button"
            label="Entrar"
            loading-label="Entrando..."
            :loading="authStore.loading"
            :disabled="!email || !password"
            @click="submitLogin"
          />
        </form>

        <div class="demo-actions">
          <button type="button" :disabled="authStore.loading" @click="demoLogin('admin')">
            Demo Admin
          </button>
          <button type="button" :disabled="authStore.loading" @click="demoLogin('garcom')">
            Demo Garçom
          </button>
        </div>
      </section>

      <p class="auth-footer">
        Não tem conta?
        <button type="button" @click="router.push('/register')">Cadastre-se</button>
      </p>
    </main>

    <ion-toast
      :is-open="toastOpen"
      position="top"
      :message="authStore.error ?? 'Não foi possível entrar.'"
      :duration="3000"
      color="danger"
      @did-dismiss="toastOpen = false"
    />
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonToast } from '@ionic/vue'
import { eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline } from 'ionicons/icons'
import AuthLayout from '@/layouts/AuthLayout.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultInput from '@/components/common/VaultInput.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const toastOpen = ref(false)

async function submitLogin() {
  if (!email.value || !password.value || authStore.loading) return
  try {
    await authStore.login(email.value.trim(), password.value)
    await userStore.fetchUsuarioLogado()
    await router.replace(userStore.isAdmin ? '/admin/dashboard' : '/garcom/dashboard')
  } catch {
    toastOpen.value = true
  }
}

async function demoLogin(role: 'admin' | 'garcom') {
  email.value = role === 'admin' ? 'admin@vaultpos.com' : 'garcom@vaultpos.com'
  password.value = 'vaultpos123'
  await submitLogin()
}
</script>

<style scoped>
.auth-page { min-height: 100%; padding: 1px 24px 96px; background: #FFFFFF; font-family: 'Inter', sans-serif; }
.vault-logo { display: flex; justify-content: center; margin-top: 48px; font-size: 22px; gap: 2px; letter-spacing: 0; }
.vault-logo-vault { color: #991B1B; font-weight: 800; }
.vault-logo-pos { color: #111827; font-weight: 800; }
.auth-content { margin-top: 40px; }
h1 { margin: 0; color: #111827; font-size: 28px; font-weight: 700; line-height: 1.2; letter-spacing: 0; }
.auth-subtitle { margin: 6px 0 0; color: #6B7280; font-size: 14px; }
.auth-form { margin-top: 24px; }
.password-field { margin-top: 16px; }
.forgot-link { display: block; margin: 10px 0 0 auto; padding: 0; border: 0; background: transparent; color: #991B1B; font: 400 13px 'Inter', sans-serif; }
.login-button { margin-top: 24px; }
.demo-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.demo-actions button {
  height: 44px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: #F8FAFC;
  color: #6B7280;
  font: 500 13px 'Inter', sans-serif;
}
.auth-footer {
  position: fixed;
  right: 24px;
  bottom: calc(32px + env(safe-area-inset-bottom));
  left: 24px;
  margin: 0;
  color: #6B7280;
  font-size: 14px;
  text-align: center;
}
.auth-footer button { padding: 0; border: 0; background: transparent; color: #991B1B; font: 600 14px 'Inter', sans-serif; }
</style>
