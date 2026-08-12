<template>
  <auth-layout>
    <div class="auth-screen">
      <div class="vault-logo" aria-label="VaultPOS">
        <span class="vault-logo-vault">VAULT</span><span class="vault-logo-pos">POS</span>
      </div>

      <section class="auth-copy">
        <h1>Entrar na sua conta</h1>
        <p>Digite seus dados abaixo</p>
      </section>

      <form class="auth-form" @submit.prevent="handleLogin">
        <vault-input
          v-model="email"
          label="E-mail"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="seu@email.com"
          :icon="mailOutline"
          :disabled="authStore.loading"
        />

        <vault-input
          v-model="password"
          class="password-field"
          label="Senha"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="Digite sua senha"
          :icon="lockClosedOutline"
          :icon-right="showPassword ? eyeOffOutline : eyeOutline"
          :disabled="authStore.loading"
          @right-click="showPassword = !showPassword"
        />

        <button class="forgot-link" type="button" @click="router.push('/forgot-password')">
          Esqueceu a senha?
        </button>

        <vault-button
          class="login-button"
          label="Entrar"
          loading-label="Entrando..."
          :loading="authStore.loading"
          :disabled="!canSubmit"
          @click="handleLogin"
        />

        <div class="demo-actions">
          <vault-button
            variant="secondary"
            label="Demo Admin"
            :disabled="authStore.loading"
            @click="loginDemo('admin')"
          />
          <vault-button
            variant="secondary"
            label="Demo Garçom"
            :disabled="authStore.loading"
            @click="loginDemo('garcom')"
          />
        </div>
        <div class='separador'>
          <div class='linha' />
          <span>ou</span>
          <div class='linha' />
        </div>

        <button class='btn-google' type='button' :disabled='authStore.loading' @click='handleGoogleLogin'>
          <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 48 48' aria-hidden='true'>
            <path fill='#EA4335' d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z' />
            <path fill='#4285F4' d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z' />
            <path fill='#FBBC05' d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z' />
            <path fill='#34A853' d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z' />
          </svg>
          Entrar com Google
        </button>
      </form>

      <footer class="auth-footer">
        <span>Não tem conta? </span>
        <button type="button" @click="router.push('/register')">Cadastre-se</button>
      </footer>

      <ion-toast
        :is-open="showError"
        position="top"
        :message="errorMessage"
        :duration="3000"
        css-class="vault-auth-error-toast"
        @did-dismiss="showError = false"
      />
    </div>
  </auth-layout>
</template>

<script setup lang="ts">
import { IonToast } from '@ionic/vue'
import { eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultInput from '@/components/common/VaultInput.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const showError = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0)

async function handleLogin() {
  if (!canSubmit.value || authStore.loading) return

  try {
    await authStore.login(email.value.trim(), password.value)
    await router.replace(authStore.isAdmin ? '/admin/dashboard' : '/garcom/dashboard')
  } catch (error) {
    errorMessage.value = authStore.error || (error instanceof Error ? error.message : 'Não foi possível entrar.')
    showError.value = true
  }
}

async function loginDemo(type: 'admin' | 'garcom') {
  if (type === 'admin') {
    email.value = 'admin@vaultpos.com'
    password.value = 'admin123'
  } else {
    email.value = 'usuario@vaultpos.com'
    password.value = 'user123'
  }

  await handleLogin()
}

async function handleGoogleLogin() {
  if (authStore.loading) return
  try {
    await authStore.loginGoogle()
    await userStore.fetchUsuarioLogado()
    await router.replace(userStore.usuario?.cargo === 'admin' ? '/admin/dashboard' : '/garcom/dashboard')
  } catch (error) {
    errorMessage.value = authStore.error || (error instanceof Error ? error.message : 'Não foi possível entrar com Google.')
    showError.value = true
  }
}
</script>

<style scoped>
.auth-screen {
  min-height: 100%;
  padding: 48px 24px 96px;
  background: #FFFFFF;
}

.vault-logo {
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  letter-spacing: 2px;
}

.vault-logo-vault { color: #991B1B; font-weight: 800; }
.vault-logo-pos { color: #111827; font-weight: 800; }

.auth-copy { margin-top: 40px; }
.auth-copy h1 { margin: 0; color: #111827; font-size: 28px; font-weight: 700; line-height: 1.2; }
.auth-copy p { margin: 6px 0 0; color: #6B7280; font-size: 14px; }
.auth-form { margin-top: 24px; }
.password-field { margin-top: 16px; }

.forgot-link {
  display: block;
  margin: 10px 0 0 auto;
  border: 0;
  padding: 0;
  background: transparent;
  color: #991B1B;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
}

.login-button { margin-top: 24px; }

.demo-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.demo-actions :deep(.vault-button) { height: 44px; font-size: 13px; color: #6B7280; }

.separador {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  color: #9CA3AF;
  font-size: 13px;
}

.linha { height: 1px; flex: 1; background: #E5E7EB; }

.btn-google {
  display: flex;
  width: 100%;
  height: 52px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  background: #FFFFFF;
  color: #111827;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-google:active { background: #F9FAFB; }
.btn-google:disabled { opacity: .6; cursor: not-allowed; }

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
  cursor: pointer;
}

@media (min-width: 640px) {
  .auth-screen { width: 440px; margin: 0 auto; }
}
</style>
