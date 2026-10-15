<template>
  <ion-page>
    <ion-content fullscreen class='finance-page'>
      <ion-refresher slot='fixed' @ion-refresh='refresh'><ion-refresher-content /></ion-refresher>
      <main class='page-shell'>
        <h1>Financeiro</h1>
        <div v-if='financeiroStore.loading' class='kpi-grid'><vault-skeleton v-for='item in 4' :key='item' variant='kpi' /></div>
        <vault-error-state v-else-if='financeiroStore.error' :message='financeiroStore.error' @retry='loadPayments' />
        <div v-else class='kpi-grid'>
          <article><span>Total recebido <ion-icon :icon='trendingUpOutline' class='success' /></span><strong class='success'>{{ formatCurrency(financeiroStore.totalRecebido) }}</strong></article>
          <article><span>Via PIX <ion-icon :icon='qrCodeOutline' class='info' /></span><strong class='info'>{{ formatCurrency(financeiroStore.totalPix) }}</strong></article>
          <article><span>Via Cartão <ion-icon :icon='cardOutline' /></span><strong>{{ formatCurrency(financeiroStore.totalCartao) }}</strong></article>
          <article><span>Via Dinheiro <ion-icon :icon='cashOutline' class='warning' /></span><strong class='warning'>{{ formatCurrency(financeiroStore.totalDinheiro) }}</strong></article>
        </div>

        <section class='payments-section'><h2>Pagamentos</h2><div class='periods'><button v-for='item in periods' :key='item' type='button' :class='{ active: period === item }' @click='period = item'>{{ item }}</button></div>
          <vault-skeleton v-if='financeiroStore.loading' variant='list' />
          <vault-empty-state v-else-if='!filteredPayments.length' icon='card-outline' title='Sem pagamentos' message='Nenhum pagamento registrado no período selecionado.' />
          <div v-else class='payment-list'><article v-for='payment in filteredPayments' :key='payment.id'><span class='method-icon' :class='payment.metodo'><ion-icon :icon='methodIcon(payment.metodo)' /></span><span class='payment-copy'><strong>Mesa {{ payment.comandas?.mesa ?? '—' }} · {{ methodLabel(payment.metodo) }}</strong><small>{{ payment.usuarios?.nome || 'Usuário' }} · {{ formatTime(payment.data_pagamento) }}</small></span><b>{{ formatCurrency(payment.valor) }}</b></article></div>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import { cardOutline, cashOutline, qrCodeOutline, trendingUpOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useFinanceiroStore } from '@/stores/financeiro.store'
import type { MetodoPagamento } from '@/types/database.types'

const financeiroStore = useFinanceiroStore()
const period = ref('Hoje')
const periods = ['Hoje', 'Semana', 'Mês']
const filteredPayments = computed(() => { const now = new Date(); const start = new Date(now); if (period.value === 'Hoje') start.setHours(0,0,0,0); else start.setDate(now.getDate() - (period.value === 'Semana' ? 7 : 30)); return financeiroStore.pagamentos.filter((item) => new Date(item.data_pagamento) >= start) })
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : time.format(date) }
function methodLabel(method: MetodoPagamento) { return { pix: 'PIX', cartao: 'Cartão', dinheiro: 'Dinheiro' }[method] }
function methodIcon(method: MetodoPagamento) { return method === 'pix' ? qrCodeOutline : method === 'cartao' ? cardOutline : cashOutline }
async function loadPayments() { await financeiroStore.fetchPagamentos() }
async function refresh(event: CustomEvent) { await loadPayments(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadPayments)
</script>

<style scoped>
.finance-page{--background:var(--vault-color-bg);--color:var(--vault-color-text-1)}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(92px + env(safe-area-inset-bottom))}h1{margin:0;font-size:24px;font-weight:700}.kpi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}.kpi-grid article{min-height:104px;border-radius:12px;padding:16px;background:var(--vault-color-surface);box-shadow:0 1px 3px rgba(0,0,0,.06)}.kpi-grid span{display:flex;align-items:center;justify-content:space-between;color:var(--vault-color-text-2);font-size:12px}.kpi-grid ion-icon{font-size:16px}.kpi-grid strong{display:block;margin-top:12px;color:var(--vault-color-text-2);font-size:22px;font-weight:700}.success{color:#22C55E!important}.info{color:#0EA5E9!important}.warning{color:#F59E0B!important}.payments-section{margin-top:24px}.payments-section h2{margin:0;font-size:16px;font-weight:600}.periods{display:flex;gap:8px;margin-top:10px}.periods button{border:0;border-radius:20px;padding:7px 15px;background:var(--vault-color-surface-muted);color:var(--vault-color-text-2);font:400 12px Inter}.periods button.active{background:#111827;color:#FFFFFF;font-weight:600}.payment-list{margin-top:14px}.payment-list article{display:flex;align-items:center;margin-bottom:8px;border-radius:12px;padding:14px 16px;background:var(--vault-color-surface);box-shadow:0 1px 3px rgba(0,0,0,.06)}.method-icon{display:grid;width:40px;height:40px;flex:0 0 auto;place-items:center;border-radius:50%}.method-icon.pix{background:var(--vault-color-success-soft);color:#22C55E}.method-icon.cartao{background:var(--vault-color-info-soft);color:#0EA5E9}.method-icon.dinheiro{background:var(--vault-color-warning-soft);color:#F59E0B}.method-icon ion-icon{font-size:21px}.payment-copy{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.payment-copy strong{overflow:hidden;font-size:14px;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.payment-copy small{margin-top:3px;color:var(--vault-color-text-3);font-size:12px}.payment-list article>b{margin-left:8px;font-size:15px;font-weight:700;white-space:nowrap}
</style>
