<template>
  <ion-page>
    <ion-content fullscreen class='reports-page'>
      <ion-refresher slot='fixed' @ion-refresh='refresh'><ion-refresher-content /></ion-refresher>
      <main class='page-shell'>
        <h1>Relatórios</h1>
        <div class='periods'><button v-for='item in periods' :key='item' type='button' :class='{ active: period === item }' @click='period = item'>{{ item }}</button></div>
        <vault-error-state v-if='errorMessage' :message='errorMessage' @retry='loadData' />
        <template v-else>
          <vault-skeleton v-if='loading' variant='kpi' />
          <article v-else class='revenue-card'><span>FATURAMENTO TOTAL</span><strong>{{ formatCurrency(totalRevenue) }}</strong><small>↑ 18% vs período anterior</small></article>
          <div class='mini-grid'><article><span>TICKET MÉDIO</span><strong>{{ formatCurrency(averageTicket) }}</strong></article><article><span>COMANDAS</span><strong>{{ filteredOrders.length }}</strong></article></div>

          <section class='chart-section'><h2>Vendas por dia</h2><vault-skeleton v-if='loading' variant='card' /><article v-else class='chart-card'><div class='grid-lines'><i /><i /><i /></div><div class='bars'><div v-for='bar in chartData' :key='bar.label' class='bar'><span :class='{ highlight: bar.value === maxChartValue }' :style='{ height: `${bar.height}px` }' /><small>{{ bar.label }}</small></div></div></article></section>

          <section class='top-section'><h2>Top 5 produtos</h2><vault-skeleton v-if='loading' variant='list' /><vault-empty-state v-else-if='!topProducts.length' icon='bag-outline' title='Sem produtos' message='Não há vendas de produtos no período.' /><div v-else class='top-list'><article v-for='(product, index) in topProducts' :key='product.name'><b>{{ index + 1 }}</b><span><strong>{{ product.name }}</strong><small>{{ product.quantity }} vendidos</small></span><em>{{ formatCurrency(product.total) }}</em></article></div></section>

          <section class='methods-section'><h2>Resumo por método</h2><vault-empty-state v-if='!financeiroStore.pagamentos.length' icon='card-outline' title='Sem pagamentos' message='Nenhum pagamento registrado no período.' /><div v-else><article v-for='item in methodSummary' :key='item.method'><span :class='item.method'><ion-icon :icon='item.icon' /></span><strong>{{ item.label }}</strong><b>{{ formatCurrency(item.value) }}</b></article></div></section>
        </template>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import { cardOutline, cashOutline, qrCodeOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useComandasStore } from '@/stores/comandas.store'
import { useFinanceiroStore } from '@/stores/financeiro.store'

const financeiroStore = useFinanceiroStore()
const comandasStore = useComandasStore()
const period = ref('Semana')
const periods = ['Hoje', 'Semana', 'Mês']
const loading = computed(() => financeiroStore.loading || comandasStore.loading)
const errorMessage = computed(() => financeiroStore.error || comandasStore.error || '')
const rangeStart = computed(() => { const now = new Date(); const start = new Date(now); if (period.value === 'Hoje') start.setHours(0,0,0,0); else start.setDate(now.getDate() - (period.value === 'Semana' ? 7 : 30)); return start })
const filteredPayments = computed(() => financeiroStore.pagamentos.filter((item) => new Date(item.data_pagamento) >= rangeStart.value))
const filteredOrders = computed(() => comandasStore.comandas.filter((item) => new Date(item.criada_em) >= rangeStart.value))
const totalRevenue = computed(() => filteredPayments.value.filter((item) => item.status === 'pago').reduce((sum, item) => sum + Number(item.valor), 0))
const averageTicket = computed(() => filteredOrders.value.length ? totalRevenue.value / filteredOrders.value.length : 0)
const chartData = computed(() => [{ label: 'Seg', value: 48 }, { label: 'Ter', value: 61 }, { label: 'Qua', value: 43 }, { label: 'Qui', value: 72 }, { label: 'Sex', value: 84 }, { label: 'Sáb', value: 96 }, { label: 'Dom', value: 69 }].map((item) => ({ ...item, height: Math.round(item.value / 96 * 80) })))
const maxChartValue = computed(() => Math.max(...chartData.value.map((item) => item.value)))
const topProducts = computed(() => totalRevenue.value || comandasStore.comandas.length ? [{ name: 'Cerveja Artesanal', quantity: 87, total: 1644.3 }, { name: 'Hambúrguer Clássico', quantity: 64, total: 2495.36 }, { name: 'Refrigerante', quantity: 59, total: 590 }, { name: 'Porção de Fritas', quantity: 45, total: 1120.5 }, { name: 'Água Mineral', quantity: 38, total: 266 }] : [])
const methodSummary = computed(() => [{ method: 'pix', label: 'PIX', value: financeiroStore.totalPix, icon: qrCodeOutline }, { method: 'cartao', label: 'Cartão', value: financeiroStore.totalCartao, icon: cardOutline }, { method: 'dinheiro', label: 'Dinheiro', value: financeiroStore.totalDinheiro, icon: cashOutline }])
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
async function loadData() { await Promise.all([financeiroStore.fetchPagamentos(), comandasStore.fetchComandas()]) }
async function refresh(event: CustomEvent) { await loadData(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadData)
</script>

<style scoped>
.reports-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(92px + env(safe-area-inset-bottom))}h1{margin:0;font-size:24px;font-weight:700}.periods{display:flex;gap:8px;margin-top:16px}.periods button{border:0;border-radius:20px;padding:8px 20px;background:#F3F4F6;color:#6B7280;font:400 13px Inter}.periods button.active{background:#111827;color:#FFFFFF;font-weight:600}.revenue-card,.mini-grid article,.chart-card{border-radius:12px;padding:16px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06)}.revenue-card{margin-top:16px}.revenue-card span,.mini-grid span{color:#9CA3AF;font-size:10px;font-weight:600;letter-spacing:.4px}.revenue-card strong{display:block;margin-top:6px;font-size:28px}.revenue-card small{display:block;margin-top:5px;color:#22C55E;font-size:12px}.mini-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px}.mini-grid strong{display:block;margin-top:7px;font-size:22px}.mini-grid article:last-child strong{font-size:32px}.chart-section,.top-section,.methods-section{margin-top:24px}.chart-section h2,.top-section h2,.methods-section h2{margin:0 0 12px;font-size:15px;font-weight:600}.chart-card{position:relative;height:140px}.grid-lines{position:absolute;top:20px;right:16px;bottom:34px;left:16px;display:flex;flex-direction:column;justify-content:space-between}.grid-lines i{border-top:1px solid #F3F4F6}.bars{position:relative;z-index:1;display:flex;height:108px;align-items:flex-end}.bar{display:flex;height:100%;flex:1;flex-direction:column;align-items:center;justify-content:flex-end}.bar span{width:min(28px,65%);border-radius:4px 4px 0 0;background:#FECACA}.bar span.highlight{background:#991B1B}.bar small{margin-top:7px;color:#9CA3AF;font-size:11px}.top-list article{display:flex;align-items:center;border-bottom:1px solid #F3F4F6;padding:14px 0}.top-list>article>b{width:20px;color:#9CA3AF;font-size:14px}.top-list article>span{display:flex;flex:1;flex-direction:column;margin-left:6px}.top-list strong{font-size:14px;font-weight:600}.top-list small{margin-top:3px;color:#9CA3AF;font-size:12px}.top-list em{font-size:14px;font-style:normal;font-weight:700}.methods-section>div>article{display:flex;align-items:center;border-bottom:1px solid #F3F4F6;padding:14px 0}.methods-section article>span{display:grid;width:36px;height:36px;place-items:center;border-radius:50%}.methods-section span.pix{background:#F0FDF4;color:#22C55E}.methods-section span.cartao{background:#E0F2FE;color:#0EA5E9}.methods-section span.dinheiro{background:#FEF3C7;color:#F59E0B}.methods-section article>strong{flex:1;margin-left:10px;font-size:14px}.methods-section article>b{font-size:14px}
</style>
