<template>
  <ion-page>
    <ion-content :fullscreen="true" class="page-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content /></ion-refresher>
      <main class="page-shell">
        <header class="dashboard-header">
          <div><span>{{ greeting }}</span><h1>{{ userStore.nomeUsuario || 'Administrador' }}</h1></div>
          <button type="button" @click="router.push('/admin/configuracoes')"><VaultAvatar :name="userStore.nomeUsuario || 'Admin'" /></button>
        </header>

        <VaultErrorState v-if="error" :message="error" @retry="load" />
        <template v-else>
          <section class="summary-section">
            <h2>Resumo de hoje</h2>
            <div v-if="loading" class="kpi-grid"><VaultSkeleton v-for="item in 4" :key="item" variant="kpi" /></div>
            <div v-else class="kpi-grid">
              <article><span>Vendas do dia</span><strong>{{ money(financeiroStore.totalRecebido) }}</strong><small class="positive">↑ +12% hoje</small></article>
              <article><span>Comandas abertas</span><strong>{{ comandasStore.totalComandasAbertas }}</strong><small>em atendimento</small></article>
              <article class="warning"><span>Estoque baixo</span><strong>{{ estoqueStore.totalEstoqueBaixo }}</strong><small>produtos</small></article>
              <article><span>Clientes atendidos</span><strong>{{ clientsToday }}</strong><small>hoje</small></article>
            </div>
          </section>

          <section class="chart-section">
            <div class="section-title"><h2>Vendas - últimos 7 dias</h2><div class="pills"><button v-for="item in ['Hoje','Semana','Mês']" :key="item" :class="{ active: period === item }" @click="period = item">{{ item }}</button></div></div>
            <div class="chart-card">
              <div class="chart-grid"><i v-for="line in 3" :key="line"></i></div>
              <div v-for="(bar, index) in chartData" :key="bar.day" class="bar-column">
                <span class="bar" :class="{ highlight: index === chartData.length - 1 }" :style="{ height: bar.height + 'px' }"></span>
                <small>{{ bar.day }}</small>
              </div>
            </div>
          </section>

          <section class="latest-section">
            <div class="section-title"><h2>Últimas comandas</h2><button class="see-all" @click="router.push('/garcom/comandas')">Ver todas</button></div>
            <VaultEmptyState v-if="!comandasStore.comandas.length" icon="receipt-outline" title="Nenhuma comanda" message="Ainda não há comandas registradas." />
            <button v-for="order in comandasStore.comandas.slice(0, 3)" v-else :key="order.id" class="latest-row" @click="router.push('/garcom/comandas/' + order.id)">
              <i :class="order.status"></i><strong>Mesa {{ order.mesa ?? '-' }}</strong><span>{{ time(order.criada_em) }}</span><b>{{ money(order.total) }}</b>
            </button>
          </section>
        </template>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import VaultAvatar from '@/components/common/VaultAvatar.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useComandasStore } from '@/stores/comandas.store'
import { useEstoqueStore } from '@/stores/estoque.store'
import { useFinanceiroStore } from '@/stores/financeiro.store'
import { useUserStore } from '@/stores/user.store'

const router = useRouter()
const userStore = useUserStore()
const comandasStore = useComandasStore()
const financeiroStore = useFinanceiroStore()
const estoqueStore = useEstoqueStore()
const period = ref('Semana')
const chartData = [{day:'Seg',height:36},{day:'Ter',height:52},{day:'Qua',height:45},{day:'Qui',height:68},{day:'Sex',height:58},{day:'Sáb',height:74},{day:'Dom',height:80}]
const loading = computed(() => comandasStore.loading || financeiroStore.loading || estoqueStore.loading)
const error = computed(() => comandasStore.error || financeiroStore.error || estoqueStore.error)
const greeting = computed(() => { const h = new Date().getHours(); return h < 12 ? 'Bom dia,' : h < 18 ? 'Boa tarde,' : 'Boa noite,' })
const clientsToday = computed(() => {
  const today = new Date().toDateString()
  return new Set(comandasStore.comandas.filter((o) => new Date(o.criada_em).toDateString() === today).map((o) => o.cliente_id).filter(Boolean)).size
})
function money(value: number) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value ?? 0) }
function time(value: string) { return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(value)) }
async function load() {
  if (!userStore.usuario) await userStore.fetchUsuarioLogado()
  await Promise.all([comandasStore.fetchComandas(), financeiroStore.fetchPagamentos(), estoqueStore.fetchProdutos()])
}
async function refresh(event: CustomEvent) { await load(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(load)
</script>

<style scoped>
.page-content { --background: #F8FAFC; }
.page-shell { min-height: 100%; padding: calc(56px + env(safe-area-inset-top)) 20px 36px; font-family: 'Inter',sans-serif; }
.dashboard-header { display:flex;align-items:center;justify-content:space-between; }
.dashboard-header span { color:#6B7280;font-size:14px; }
.dashboard-header h1 { margin:2px 0 0;color:#111827;font-size:28px;font-weight:700;letter-spacing:0; }
.dashboard-header button { padding:0;border:0;border-radius:50%;background:transparent; }
section { margin-top:24px; }
h2 { margin:0;color:#111827;font-size:16px;font-weight:600;letter-spacing:0; }
.kpi-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px; }
.kpi-grid article,.kpi-grid > :deep(.skeleton) { min-height:116px;padding:16px;border-radius:12px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06); }
.kpi-grid article span { display:block;color:#9CA3AF;font-size:10px;font-weight:600;text-transform:uppercase; }
.kpi-grid article strong { display:block;margin-top:8px;color:#111827;font-size:22px;font-weight:700;letter-spacing:0; }
.kpi-grid article:nth-child(n+2) strong { font-size:32px; }
.kpi-grid article small { display:block;margin-top:5px;color:#9CA3AF;font-size:12px; }
.kpi-grid article small.positive { color:#22C55E; }
.kpi-grid article.warning { border:1px solid #FEF3C7;background:#FFFBEB; }
.kpi-grid article.warning span { color:#D97706; }
.kpi-grid article.warning strong { color:#F59E0B; }
.section-title { display:flex;align-items:center;justify-content:space-between;gap:10px; }
.section-title h2 { font-size:15px; }
.pills { display:flex;gap:4px; }
.pills button { padding:6px 9px;border:0;border-radius:20px;background:#F3F4F6;color:#6B7280;font:400 11px 'Inter',sans-serif; }
.pills button.active { background:#111827;color:#FFFFFF;font-weight:600; }
.chart-card { position:relative;display:flex;height:130px;align-items:flex-end;justify-content:space-between;margin-top:12px;padding:16px 12px 12px;border-radius:12px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06); }
.chart-grid { position:absolute;inset:16px 12px 30px;display:flex;flex-direction:column;justify-content:space-between; }
.chart-grid i { width:100%;border-top:1px solid #F3F4F6; }
.bar-column { position:relative;z-index:1;display:flex;width:12%;align-items:center;flex-direction:column;gap:6px; }
.bar { width:24px;max-width:100%;border-radius:4px 4px 0 0;background:#FECACA; }
.bar.highlight { background:#991B1B; }
.bar-column small { color:#9CA3AF;font-size:11px; }
.see-all { border:0;background:transparent;color:#991B1B;font:600 13px 'Inter',sans-serif; }
.latest-row { display:flex;width:100%;align-items:center;gap:8px;padding:14px 0;border:0;border-bottom:1px solid #F3F4F6;background:transparent;text-align:left; }
.latest-row i { width:8px;height:8px;border-radius:50%;background:#9CA3AF; }
.latest-row i.aberta { background:#22C55E; }
.latest-row strong { color:#111827;font-size:14px;font-weight:600; }
.latest-row span { flex:1;color:#9CA3AF;font-size:12px; }
.latest-row b { color:#111827;font-size:14px;font-weight:600; }
</style>
