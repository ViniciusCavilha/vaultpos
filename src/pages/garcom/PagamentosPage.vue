<template>
  <ion-page>
    <ion-content class="payment-page">
      <div class="handle" />
      <main v-if="!success" class="payment-shell">
        <header><h1>Pagamento</h1><button type="button" aria-label="Fechar" @click="emit('close')"><ion-icon :icon="closeOutline" /></button></header>
        <section class="total-block"><span>TOTAL A PAGAR</span><strong>{{ formatCurrency(total) }}</strong><p>Mesa {{ mesa }} • {{ totalItens }} itens</p></section>
        <section class="method-section"><h2>Como vai pagar?</h2><div class="methods">
          <button v-for="option in methods" :key="option.value" type="button" :class="{ selected: method === option.value }" @click="method = option.value"><ion-icon :icon="option.icon" :class="option.value" /><span>{{ option.label }}</span></button>
        </div></section>
        <section v-if="method === 'pix'" class="pix-card"><ion-icon :icon="qrCodeOutline" /><p>Escaneie para pagar via PIX</p></section>
        <section v-if="method === 'dinheiro'" class="cash-block"><label>Valor recebido<input v-model.number="received" type="number" inputmode="decimal" min="0" step="0.01" /></label><strong>Troco: {{ formatCurrency(change) }}</strong></section>
        <vault-button class="confirm-button" label="Confirmar Pagamento" loading-label="Processando..." :loading="processing" :disabled="method === 'dinheiro' && received < total" @click="confirmPayment" />
      </main>
      <main v-else class="success-screen">
        <div><ion-icon :icon="checkmarkOutline" /></div><h1>Pagamento confirmado!</h1><p>{{ formatCurrency(total) }} • {{ methodLabel }}</p><vault-button variant="ghost" label="Fechar" @click="finish" />
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import { cardOutline, cashOutline, checkmarkOutline, closeOutline, qrCodeOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultButton from '@/components/common/VaultButton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { useComandasStore } from '@/stores/comandas.store'
import { useFinanceiroStore } from '@/stores/financeiro.store'
type Method = 'pix' | 'cartao' | 'dinheiro'
const props = withDefaults(defineProps<{ comandaId?: string; total?: number; mesa?: number | string; totalItens?: number }>(), { comandaId: '', total: 0, mesa: '—', totalItens: 0 })
const emit = defineEmits<{ close: []; paid: [] }>()
const router = useRouter()
const financeiroStore = useFinanceiroStore()
const comandasStore = useComandasStore()
const { showToast } = useVaultToast()
const total = computed(() => Number(props.total) || 0)
const method = ref<Method>('pix')
const received = ref(0)
const processing = ref(false)
const success = ref(false)
const methods = [{ value: 'pix' as const, label: 'PIX', icon: qrCodeOutline }, { value: 'cartao' as const, label: 'Cartão', icon: cardOutline }, { value: 'dinheiro' as const, label: 'Dinheiro', icon: cashOutline }]
const change = computed(() => Math.max(0, Number(received.value) - total.value))
const methodLabel = computed(() => ({ pix: 'PIX', cartao: 'Cartão', dinheiro: 'Dinheiro' })[method.value])
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
async function confirmPayment() {
  if (!props.comandaId || processing.value) { if (!props.comandaId) await showToast('Comanda não identificada.', 'error'); return }
  processing.value = true
  try {
    const payment = await financeiroStore.registrarPagamento({ comanda_id: props.comandaId, metodo: method.value, valor: total.value })
    if (!payment) throw new Error('Não foi possível registrar o pagamento para o usuário atual.')
    await comandasStore.fechar(props.comandaId)
    success.value = true
    emit('paid')
  }
  catch (error) { await showToast(financeiroStore.error || comandasStore.error || (error instanceof Error ? error.message : 'Erro ao processar pagamento.'), 'error') }
  finally { processing.value = false }
}
async function finish() { emit('close'); await router.replace('/garcom/comandas') }
</script>

<style scoped>
.payment-page{--background:var(--vault-color-surface);--color:var(--vault-color-text-1)}.handle{width:32px;height:4px;margin:12px auto;border-radius:2px;background:var(--vault-color-border)}.payment-shell{padding:0 20px 28px}.payment-shell header{display:flex;align-items:center;justify-content:space-between}.payment-shell header h1{margin:0;font-size:18px;font-weight:700}.payment-shell header button{display:grid;width:28px;height:28px;place-items:center;border:0;border-radius:50%;background:var(--vault-color-surface-muted);color:var(--vault-color-text-2)}.total-block{margin-top:24px;text-align:center}.total-block span{color:var(--vault-color-text-3);font-size:11px;font-weight:600;letter-spacing:.5px}.total-block strong{display:block;margin-top:4px;font-size:40px;font-weight:700}.total-block p{margin:4px 0 0;color:var(--vault-color-text-2);font-size:13px}.method-section{margin-top:24px}.method-section h2{margin:0 0 10px;font-size:14px;font-weight:600}.methods{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.methods button{display:flex;min-height:68px;flex-direction:column;align-items:center;justify-content:center;border:1.5px solid transparent;border-radius:10px;padding:12px 8px;background:var(--vault-color-surface-subtle);color:var(--vault-color-text-1)}.methods button.selected{border-color:#991B1B;background:var(--vault-color-primary-soft)}.methods ion-icon{color:var(--vault-color-text-3);font-size:24px}.methods button.selected ion-icon.pix{color:#991B1B}.methods button.selected ion-icon.cartao{color:#0EA5E9}.methods button.selected ion-icon.dinheiro{color:#F59E0B}.methods span{margin-top:6px;font-size:12px;font-weight:600}.pix-card{display:flex;flex-direction:column;align-items:center;margin-top:16px;border:1px solid var(--vault-color-border);border-radius:12px;padding:16px;background:var(--vault-color-surface)}.pix-card ion-icon{color:#22C55E;font-size:100px}.pix-card p{margin:8px 0 0;color:var(--vault-color-text-3);font-size:13px}.cash-block{margin-top:16px}.cash-block label{display:flex;flex-direction:column;color:var(--vault-color-text-2);font-size:13px}.cash-block input{height:48px;margin-top:6px;border:1px solid var(--vault-color-border);border-radius:10px;outline:0;padding:0 16px;background:var(--vault-color-surface-subtle);color:var(--vault-color-text-1);font:400 14px Inter}.cash-block strong{display:block;margin-top:8px;color:#22C55E;font-size:14px;font-weight:600}.confirm-button{margin-top:24px}.success-screen{display:flex;min-height:420px;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center;animation:fade-in .3s ease}.success-screen>div{display:grid;width:80px;height:80px;place-items:center;border-radius:50%;background:var(--vault-color-success-soft);color:#22C55E}.success-screen ion-icon{font-size:40px}.success-screen h1{margin:20px 0 0;font-size:22px;font-weight:700}.success-screen p{margin:6px 0 0;color:var(--vault-color-text-2);font-size:14px}.success-screen :deep(.vault-button){margin-top:24px}@keyframes fade-in{from{opacity:0}to{opacity:1}}
</style>
