<template>
  <auth-layout>
    <div class="auth-screen">
      <div class="vault-logo" aria-label="VaultPOS">
        <span class="vault-logo-vault">VAULT</span><span class="vault-logo-pos">POS</span>
      </div>

      <section v-if="!sent" class="recovery-content">
        <div class="recovery-icon">
          <ion-icon :icon="lockClosedOutline" />
        </div>
        <h1>Esqueceu a senha?</h1>
        <p>Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>

        <form @submit.prevent="handleReset">
          <vault-input
            v-model="email"
            class="email-field"
            label="E-mail"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="seu@email.com"
            :icon="mailOutline"
            :error="emailError"
            :disabled="authStore.loading"
            @blur="emailTouched = true"
          />

          <vault-button
            class="submit-button"
            label="Enviar link de recuperação"
            loading-label="Enviando..."
            :loading="authStore.loading"
            :disabled="Boolean(validateEmail())"
            @click="handleReset"
          />
        </form>

        <button class="back-link" type="button" @click="router.push('/login')">← Voltar ao login</button>
      </section>

      <section v-else class="success-content">
        <div class="success-icon">
          <ion-icon :icon="checkmarkOutline" />
        </div>
        <h1>Link enviado!</h1>
        <p>Verifique sua caixa de entrada.</p>
        <vault-button
          class="success-button"
          variant="outline"
          label="Voltar ao login"
          @click="router.push('/login')"
        />
      </section>
    </div>
  </auth-layout>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { checkmarkOutline, lockClosedOutline, mailOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultInput from '@/components/common/VaultInput.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useVaultToast()
const email = ref('')
const emailTouched = ref(false)
const sent = ref(false)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail() {
  if (!email.value.trim()) return 'Campo obrigatório'
  if (!emailPattern.test(email.value.trim())) return 'E-mail inválido'
  return ''
}

const emailError = computed(() => emailTouched.value ? validateEmail() : '')

async function handleReset() {
  emailTouched.value = true
  if (validateEmail() || authStore.loading) return

  try {
    await authStore.forgotPassword(email.value.trim())
    sent.value = true
  } catch (error) {
    await showToast(authStore.error || (error instanceof Error ? error.message : 'Não foi possível enviar o link.'), 'error')
  }
}
</script>

<style scoped>
.auth-screen { min-height: 100%; padding: 48px 24px; background: #FFFFFF; }
.vault-logo { text-align: center; font-size: 22px; letter-spacing: 2px; }
.vault-logo-vault { color: #991B1B; font-weight: 800; }
.vault-logo-pos { color: #111827; font-weight: 800; }
.recovery-content, .success-content { margin-top: 48px; text-align: center; }
.recovery-icon, .success-icon {
  display: grid;
  width: 80px;
  height: 80px;
  margin: 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #FEF2F2;
  color: #991B1B;
}
.recovery-icon ion-icon, .success-icon ion-icon { font-size: 36px; }
.recovery-content h1 { margin: 24px 0 0; color: #111827; font-size: 26px; font-weight: 700; }
.recovery-content > p, .success-content > p {
  max-width: 280px;
  margin: 10px auto 0;
  color: #6B7280;
  font-size: 14px;
  line-height: 1.5;
}
.email-field { margin-top: 32px; text-align: left; }
.submit-button { margin-top: 16px; }
.back-link {
  margin-top: 20px;
  border: 0;
  padding: 0;
  background: transparent;
  color: #991B1B;
  font-family: inherit;
  font-size: 14px;
}
.success-content { padding-top: 28px; }
.success-icon { background: #F0FDF4; color: #22C55E; }
.success-content h1 { margin: 24px 0 0; color: #111827; font-size: 24px; font-weight: 700; }
.success-button { margin-top: 24px; }

@media (min-width: 640px) {
  .auth-screen { width: 440px; margin: 0 auto; }
}
</style>
