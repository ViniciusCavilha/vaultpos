<template>
  <ion-page>
    <ion-content fullscreen class='dashboard-page'>
      <ion-refresher slot='fixed' @ion-refresh='refresh'><ion-refresher-content /></ion-refresher>
      <main class='page-shell'>
        <header class='page-header'><div><p>{{ greeting }}</p><h1>{{ displayName }}</h1></div><button type='button' @click='router.push(`/admin/configuracoes`)'><vault-avatar :name='displayName' size='md' /></button></header>
        <section class='summary-section'><h2>Resumo de hoje</h2>
          <div v-if='loading' class='kpi-grid'><vault-skeleton v-for='item in 4' :key='item' variant='kpi' /></div>
          <vault-error-state v-else-if='errorMessage' :message='errorMessage' @retry='loadData' />
          <div v-else class='kpi-grid'>
            <article class='kpi-card'><span>VENDAS RECEBIDAS <ion-icon :icon='trendingUpOutline' class='success' /></span><strong class='money'>{{ formatCurrency(financeiroStore.totalRecebido) }}</strong><small class='success'>Pagamentos confirmados</small></article>
            <article class='kpi-card'><span>COMANDAS ABERTAS <ion-icon :icon='receiptOutline' /></span><strong>{{ comandasStore.totalComandasAbertas }}</strong><small>Em atendimento agora</small></article>
            <article class='kpi-card warning'><span>ESTOQUE BAIXO</span><strong>{{ estoqueStore.totalEstoqueBaixo }}</strong><small>produtos</small></article>
            <article class='kpi-card'><span>CLIENTES ATENDIDOS <ion-icon :icon='peopleOutline' /></span><strong>{{ clientsToday }}</strong><small>hoje</small></article>
          </div>
        </section>

        <section class='chart-section'><div class='section-heading'><h2>Vendas — últimos 7 dias</h2><div class='period-pills'><button v-for='item in periods' :key='item' type='button' :class='{ active: period === item }' @click='period = item'>{{ item }}</button></div></div>
          <vault-skeleton v-if='loading' variant='card' />
          <article v-else class='chart-card'><div class='grid-lines'><i /><i /><i /></div><div class='bars'><div v-for='(bar, index) in chartData' :key='bar.label' class='bar-column'><span :class='{ highlight: index === chartData.length - 1 }' :style='{ height: `${bar.height}px` }' /><small>{{ bar.label }}</small></div></div></article>
        </section>

        <section class='recent-section'><div class='section-heading'><h2>Últimas comandas</h2><button type='button' @click='router.push(`/garcom/comandas`)'>Ver todas</button></div>
          <vault-skeleton v-if='loading' variant='list' />
          <vault-empty-state v-else-if='!recentOrders.length' icon='receipt-outline' title='Nenhuma comanda' message='Ainda não há comandas registradas.' />
          <div v-else class='recent-list'><button v-for='order in recentOrders' :key='order.id' type='button' @click='router.push(`/garcom/comandas/${order.id}`)'><i :class='order.status' /><span><strong>Mesa {{ order.mesa ?? '—' }}</strong><small>{{ formatTime(order.criada_em) }}</small></span><b>{{ formatCurrency(order.total || order.subtotal) }}</b></button></div>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import { peopleOutline, receiptOutline, trendingUpOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultAvatar from '@/components/common/VaultAvatar.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useComandasStore } from '@/stores/comandas.store'
import { useEstoqueStore } from '@/stores/estoque.store'
import { useFinanceiroStore } from '@/stores/financeiro.store'
import { useUserStore } from '@/stores/user.store'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const comandasStore = useComandasStore()
const estoqueStore = useEstoqueStore()
const financeiroStore = useFinanceiroStore()
const period = ref('Semana')
const periods = ['Hoje', 'Semana', 'Mês']
const chartData = [{ label: 'Seg', height: 42 }, { label: 'Ter', height: 58 }, { label: 'Qua', height: 36 }, { label: 'Qui', height: 64 }, { label: 'Sex', height: 72 }, { label: 'Sáb', height: 80 }, { label: 'Dom', height: 54 }]
const loading = computed(() => comandasStore.loading || estoqueStore.loading || financeiroStore.loading)
const errorMessage = computed(() => comandasStore.error || estoqueStore.error || financeiroStore.error || '')
const displayName = computed(() => userStore.nomeUsuario || String(authStore.user?.user_metadata?.full_name || 'Administrador'))
const greeting = computed(() => { const hour = new Date().getHours(); return hour < 12 ? 'Bom dia,' : hour < 18 ? 'Boa tarde,' : 'Boa noite,' })
const recentOrders = computed(() => comandasStore.comandas.slice(0, 3))
const clientsToday = computed(() => { const today = new Date().toDateString(); return new Set(comandasStore.comandas.filter((item) => new Date(item.criada_em).toDateString() === today).map((item) => item.cliente_id).filter(Boolean)).size })
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : time.format(date) }
async function loadData() { await Promise.all([comandasStore.fetchComandas(), financeiroStore.fetchPagamentos(), estoqueStore.fetchProdutos()]) }
async function refresh(event: CustomEvent) { await loadData(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadData)
</script>

<style scoped>
.dashboard-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(92px + env(safe-area-inset-bottom))}.page-header{display:flex;align-items:center;justify-content:space-between}.page-header p{margin:0;color:#6B7280;font-size:14px}.page-header h1{margin:2px 0 0;color:#111827;font-size:28px;font-weight:700}.page-header button{border:0;padding:0;background:transparent}.page-header :deep(.vault-avatar){width:40px;height:40px}.summary-section{margin-top:24px}h2{margin:0;color:#111827;font-size:16px;font-weight:600}.kpi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.kpi-card{display:flex;min-height:126px;flex-direction:column;border-radius:12px;padding:16px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06)}.kpi-card>span{display:flex;align-items:center;justify-content:space-between;color:#9CA3AF;font-size:10px;font-weight:600;letter-spacing:.3px}.kpi-card ion-icon{font-size:16px}.kpi-card strong{display:block;margin-top:10px;color:#111827;font-size:32px;font-weight:700;line-height:1.1}.kpi-card strong.money{font-size:22px}.kpi-card small{margin-top:auto;color:#9CA3AF;font-size:12px}.kpi-card .success{color:#22C55E}.kpi-card.warning{border:1px solid #FEF3C7;background:#FFFBEB}.kpi-card.warning span{color:#D97706}.kpi-card.warning strong{color:#F59E0B}.chart-section,.recent-section{margin-top:24px}.section-heading{display:flex;align-items:center;justify-content:space-between}.section-heading h2{font-size:15px}.period-pills{display:flex;gap:5px}.period-pills button{border:0;border-radius:20px;padding:6px 10px;background:#F3F4F6;color:#6B7280;font:400 12px Inter}.period-pills button.active{background:#111827;color:#FFFFFF;font-weight:600}.chart-card{position:relative;height:140px;margin-top:12px;border-radius:12px;padding:16px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06)}.grid-lines{position:absolute;top:20px;right:16px;bottom:34px;left:16px;display:flex;flex-direction:column;justify-content:space-between}.grid-lines i{border-top:1px solid #F3F4F6}.bars{position:relative;z-index:1;display:flex;height:108px;align-items:flex-end;justify-content:space-around}.bar-column{display:flex;height:100%;flex:1;flex-direction:column;align-items:center;justify-content:flex-end}.bar-column span{width:min(28px,65%);border-radius:4px 4px 0 0;background:#FECACA}.bar-column span.highlight{background:#991B1B}.bar-column small{margin-top:7px;color:#9CA3AF;font-size:11px}.section-heading>button{border:0;background:transparent;color:#991B1B;font:600 13px Inter}.recent-list{margin-top:8px}.recent-list button{display:flex;width:100%;align-items:center;border:0;border-bottom:1px solid #F3F4F6;padding:14px 0;background:transparent;text-align:left}.recent-list>button>i{width:8px;height:8px;border-radius:50%;background:#9CA3AF}.recent-list>button>i.aberta{background:#22C55E}.recent-list button span{display:flex;flex:1;align-items:center;margin-left:9px}.recent-list button strong{color:#111827;font-size:14px;font-weight:600}.recent-list button small{margin-left:8px;color:#9CA3AF;font-size:12px}.recent-list button>b{color:#111827;font-size:14px;font-weight:600}
</style>
