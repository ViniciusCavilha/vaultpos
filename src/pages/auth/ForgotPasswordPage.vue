<template>
  <AuthLayout>
    <main class="auth-page">
      <div class="vault-logo" aria-label="VAULTPOS">
        <span class="vault-logo-vault">VAULT</span><span class="vault-logo-pos">POS</span>
      </div>

      <section v-if="!sent" class="recovery-content">
        <div class="status-icon"><ion-icon :icon="lockClosedOutline" /></div>
        <h1>Esqueceu a senha?</h1>
        <p>Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>

        <VaultInput
          v-model="email"
          class="email-field"
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          :icon="mailOutline"
          :error="emailError"
          @blur="validateEmail"
        />
        <VaultButton
          class="submit-button"
          label="Enviar link de recuperação"
          loading-label="Enviando..."
          :loading="authStore.loading"
          @click="sendLink"
        />
        <button class="back-link" type="button" @click="router.push('/login')">
          ← Voltar ao login
        </button>
      </section>

      <section v-else class="recovery-content success">
        <div class="status-icon status-icon--success">
          <ion-icon :icon="checkmarkOutline" />
        </div>
        <h1>Link enviado!</h1>
        <p>Verifique sua caixa de entrada.</p>
        <VaultButton
          class="success-button"
          variant="outline"
          label="Voltar ao login"
          @click="router.push('/login')"
        />
      </section>
    </main>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { checkmarkOutline, lockClosedOutline, mailOutline } from 'ionicons/icons'
import AuthLayout from '@/layouts/AuthLayout.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultInput from '@/components/common/VaultInput.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useVaultToast()
const email = ref('')
const emailError = ref('')
const sent = ref(false)

function validateEmail() {
  if (!email.value.trim()) emailError.value = 'Campo obrigatório'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) emailError.value = 'E-mail inválido'
  else emailError.value = ''
}

async function sendLink() {
  validateEmail()
  if (emailError.value || authStore.loading) return
  try {
    await authStore.forgotPassword(email.value.trim())
    sent.value = true
  } catch {
    await showToast(authStore.error ?? 'Não foi possível enviar o link.', 'error')
  }
}
</script>

<style scoped>
.auth-page { min-height: 100%; padding: 1px 24px 40px; background: #FFFFFF; font-family: 'Inter', sans-serif; }
.vault-logo { display: flex; justify-content: center; margin-top: 48px; font-size: 22px; gap: 2px; }
.vault-logo-vault { color: #991B1B; font-weight: 800; }
.vault-logo-pos { color: #111827; font-weight: 800; }
.recovery-content { margin-top: 48px; text-align: center; }
.status-icon { display: grid; width: 80px; height: 80px; margin: 0 auto; place-items: center; border-radius: 50%; background: #FEF2F2; color: #991B1B; }
.status-icon ion-icon { width: 36px; height: 36px; }
.status-icon--success { background: #F0FDF4; color: #22C55E; }
h1 { margin: 24px 0 0; color: #111827; font-size: 26px; font-weight: 700; letter-spacing: 0; }
p { max-width: 280px; margin: 10px auto 0; color: #6B7280; font-size: 14px; line-height: 1.5; }
.email-field { margin-top: 32px; text-align: left; }
.submit-button { margin-top: 16px; }
.back-link { margin-top: 20px; border: 0; background: transparent; color: #991B1B; font: 400 14px 'Inter', sans-serif; }
.success h1 { font-size: 24px; }
.success-button { margin-top: 28px; }
</style>
