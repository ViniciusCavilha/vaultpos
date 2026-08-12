<template>
  <div class="payment-sheet">
    <template v-if="!success">
      <div class="handle"></div>
      <header>
        <h2>Pagamento</h2>
        <button type="button" aria-label="Fechar" @click="emit('close')">
          <ion-icon :icon="close" />
        </button>
      </header>

      <section class="total-section">
        <span>Total a pagar</span>
        <strong>{{ formatMoney(total) }}</strong>
        <p>Mesa {{ mesa ?? '-' }} · {{ totalItens }} {{ totalItens === 1 ? 'item' : 'itens' }}</p>
      </section>

      <section class="method-section">
        <h3>Como vai pagar?</h3>
        <div class="methods">
          <button
            v-for="option in methods"
            :key="option.value"
            type="button"
            :class="{ selected: method === option.value }"
            @click="method = option.value"
          >
            <ion-icon :icon="option.icon" :class="option.value" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </section>

      <div v-if="method === 'pix'" class="pix-card">
        <ion-icon :icon="qrCodeOutline" />
        <p>Escaneie para pagar via PIX</p>
      </div>

      <div v-if="method === 'dinheiro'" class="cash-field">
        <label for="received-value">Valor recebido</label>
        <input id="received-value" v-model.number="receivedValue" type="number" min="0" step="0.01" />
        <strong>Troco: {{ formatMoney(change) }}</strong>
      </div>

      <VaultButton
        class="confirm-button"
        label="Confirmar Pagamento"
        loading-label="Processando..."
        :loading="loading"
        :disabled="method === 'dinheiro' && receivedValue < total"
        @click="confirmPayment"
      />
    </template>

    <section v-else class="success-state">
      <div class="success-icon"><ion-icon :icon="checkmark" /></div>
      <h2>Pagamento confirmado!</h2>
      <p>{{ formatMoney(total) }} · {{ methodLabel }}</p>
      <VaultButton variant="ghost" label="Fechar" @click="finish" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { cardOutline, cashOutline, checkmark, close, qrCodeOutline } from 'ionicons/icons'
import VaultButton from '@/components/common/VaultButton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { useComandasStore } from '@/stores/comandas.store'
import { useFinanceiroStore } from '@/stores/financeiro.store'
import type { MetodoPagamento } from '@/types/database.types'

const props = withDefaults(defineProps<{
  comandaId?: string
  total?: number
  mesa?: number | null
  totalItens?: number
}>(), { comandaId: '', total: 0, mesa: null, totalItens: 0 })
const emit = defineEmits<{ close: []; completed: [] }>()
const router = useRouter()
const financeiroStore = useFinanceiroStore()
const comandasStore = useComandasStore()
const { showToast } = useVaultToast()
const method = ref<MetodoPagamento>('pix')
const receivedValue = ref(0)
const loading = ref(false)
const success = ref(false)
const methods: { value: MetodoPagamento; label: string; icon: string }[] = [
  { value: 'pix', label: 'PIX', icon: qrCodeOutline },
  { value: 'cartao', label: 'Cartão', icon: cardOutline },
  { value: 'dinheiro', label: 'Dinheiro', icon: cashOutline },
]
const change = computed(() => Math.max(0, receivedValue.value - props.total))
const methodLabel = computed(() => methods.find((item) => item.value === method.value)?.label ?? '')

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}
async function confirmPayment() {
  if (!props.comandaId || loading.value) return
  loading.value = true
  try {
    await financeiroStore.registrarPagamento({
      comanda_id: props.comandaId,
      metodo: method.value,
      valor: props.total,
    })
    await comandasStore.fechar(props.comandaId)
    success.value = true
  } catch (error) {
    await showToast(error instanceof Error ? error.message : 'Erro ao processar pagamento.', 'error')
  } finally {
    loading.value = false
  }
}
async function finish() {
  emit('completed')
  emit('close')
  await router.replace('/garcom/comandas')
}
</script>

<style scoped>
.payment-sheet { min-height: 100%; padding: 0 20px calc(24px + env(safe-area-inset-bottom)); background: #FFFFFF; font-family: 'Inter', sans-serif; }
.handle { width: 32px; height: 4px; margin: 12px auto; border-radius: 2px; background: #E5E7EB; }
header { display: flex; align-items: center; justify-content: space-between; }
header h2 { margin: 0; color: #111827; font-size: 18px; font-weight: 700; letter-spacing: 0; }
header button { display: grid; width: 28px; height: 28px; padding: 0; place-items: center; border: 0; border-radius: 50%; background: #F3F4F6; color: #6B7280; }
.total-section { margin-top: 22px; text-align: center; }
.total-section span { color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.total-section strong { display: block; margin-top: 4px; color: #111827; font-size: 40px; font-weight: 700; letter-spacing: 0; }
.total-section p { margin: 4px 0 0; color: #6B7280; font-size: 13px; }
.method-section { margin-top: 24px; }
.method-section h3 { margin: 0 0 10px; color: #111827; font-size: 14px; font-weight: 600; letter-spacing: 0; }
.methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.methods button { display: flex; min-width: 0; padding: 12px 8px; flex-direction: column; align-items: center; gap: 6px; border: 1.5px solid transparent; border-radius: 10px; background: #F9FAFB; color: #111827; font: 600 12px 'Inter', sans-serif; }
.methods button.selected { border-color: #991B1B; background: #FEF2F2; }
.methods ion-icon { width: 24px; height: 24px; color: #9CA3AF; }
.methods button.selected ion-icon.pix { color: #991B1B; }
.methods button.selected ion-icon.cartao { color: #0EA5E9; }
.methods button.selected ion-icon.dinheiro { color: #F59E0B; }
.pix-card { margin-top: 20px; padding: 16px; border: 1px solid #E5E7EB; border-radius: 12px; text-align: center; }
.pix-card ion-icon { width: 100px; height: 100px; color: #22C55E; }
.pix-card p { margin: 8px 0 0; color: #9CA3AF; font-size: 13px; }
.cash-field { margin-top: 20px; }
.cash-field label { display: block; margin-bottom: 6px; color: #6B7280; font-size: 13px; }
.cash-field input { width: 100%; height: 52px; padding: 0 16px; border: 1px solid #E5E7EB; border-radius: 10px; outline: 0; background: #F9FAFB; color: #111827; font: 400 16px 'Inter', sans-serif; }
.cash-field strong { display: block; margin-top: 8px; color: #22C55E; font-size: 14px; }
.confirm-button { margin-top: 24px; }
.success-state { display: flex; min-height: 420px; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.success-icon { display: grid; width: 80px; height: 80px; place-items: center; border-radius: 50%; background: #F0FDF4; color: #22C55E; }
.success-icon ion-icon { width: 40px; height: 40px; }
.success-state h2 { margin: 20px 0 0; color: #111827; font-size: 22px; font-weight: 700; }
.success-state p { margin: 8px 0 20px; color: #6B7280; font-size: 14px; }
</style>
