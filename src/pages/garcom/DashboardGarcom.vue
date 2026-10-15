<template>
  <ion-page>
    <ion-content fullscreen class="dashboard-page">
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content /></ion-refresher>
      <main class="page-shell">
        <header class="dashboard-header">
          <div><p>{{ greeting }}</p><h1>{{ displayName }}</h1><span>{{ displayRole }}</span></div>
          <button class="avatar-button" type="button" aria-label="Abrir perfil" @click="router.push('/garcom/perfil')"><vault-avatar :name="displayName" :photo="profilePhoto" size="md" /></button>
        </header>
        <button class="open-orders-card" type="button" @click="router.push('/garcom/comandas')">
          <strong>{{ comandasStore.totalComandasAbertas }}</strong><span>comandas abertas</span><small>Toque para ver todas →</small>
        </button>
        <vault-button class="new-order-button" variant="outline" label="Abrir Nova Comanda" @click="router.push('/garcom/comandas/nova')" />
        <section class="tables-section">
          <h2>Suas mesas abertas</h2>
          <vault-skeleton v-if="comandasStore.loading" variant="list" />
          <vault-error-state v-else-if="comandasStore.error" :message="comandasStore.error" @retry="loadComandas" />
          <div v-else-if="myOpenOrders.length" class="tables-list">
            <button v-for="comanda in myOpenOrders" :key="comanda.id" class="table-row" type="button" @click="router.push(`/garcom/comandas/${comanda.id}`)">
              <span class="status-dot" /><span class="table-copy"><strong>Mesa {{ comanda.mesa ?? '—' }}</strong><small>{{ formatTime(comanda.criada_em) }}</small></span>
              <strong class="table-value">{{ formatCurrency(comanda.total ?? comanda.subtotal ?? 0) }}</strong>
            </button>
          </div>
          <p v-else class="empty-copy">Você não possui mesas abertas agora.</p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VaultAvatar from '@/components/common/VaultAvatar.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useComandasStore } from '@/stores/comandas.store'
import { useUserStore } from '@/stores/user.store'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const comandasStore = useComandasStore()
const greeting = computed(() => { const hour = new Date().getHours(); return hour < 12 ? 'Bom dia,' : hour < 18 ? 'Boa tarde,' : 'Boa noite,' })
const displayName = computed(() => userStore.nomeUsuario || String(authStore.user?.user_metadata?.full_name || 'Garçom'))
const profilePhoto = computed(() => userStore.usuario?.foto || authStore.user?.photoURL || null)
const displayRole = computed(() => userStore.usuario?.cargo === 'admin' ? 'Administrador' : 'Garçom')
const myOpenOrders = computed(() => {
  const waiterId = userStore.usuario?.id
  if (!waiterId) return comandasStore.comandasAbertas
  return comandasStore.comandasAbertas.filter((item) => !item.garcom_id || item.garcom_id === waiterId)
})
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : time.format(date) }
async function loadComandas() { await comandasStore.fetchComandas('aberta') }
async function refresh(event: CustomEvent) { await loadComandas(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadComandas)
</script>

<style scoped>
.dashboard-page{--background:var(--vault-color-bg);--color:var(--vault-color-text-1)}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(104px + env(safe-area-inset-bottom))}.dashboard-header{display:flex;align-items:center;justify-content:space-between}.dashboard-header p{margin:0;color:var(--vault-color-text-2);font-size:14px}.dashboard-header h1{margin:2px 0 0;color:var(--vault-color-text-1);font-size:26px;font-weight:700}.dashboard-header>div>span{display:block;margin-top:2px;color:var(--vault-color-text-3);font-size:13px}.avatar-button{display:grid;width:40px;height:40px;place-items:center;border:0;border-radius:50%;padding:0;background:transparent}.avatar-button :deep(.vault-avatar){width:40px;height:40px}.open-orders-card{display:flex;width:100%;flex-direction:column;margin-top:24px;border:0;border-radius:16px;padding:24px;background:#991B1B;color:#FFFFFF;text-align:left}.open-orders-card strong{font-size:48px;font-weight:700;line-height:1}.open-orders-card span{margin-top:4px;color:rgba(255,255,255,.8);font-size:14px}.open-orders-card small{margin-top:8px;color:rgba(255,255,255,.6);font-size:13px}.new-order-button{margin-top:12px}.tables-section{margin-top:28px}.tables-section h2{margin:0 0 10px;color:var(--vault-color-text-1);font-size:16px;font-weight:600}.tables-list{overflow:hidden;border-radius:12px;background:var(--vault-color-surface)}.table-row{display:flex;width:100%;align-items:center;border:0;border-bottom:1px solid var(--vault-color-surface-muted);padding:14px 16px;background:var(--vault-color-surface);text-align:left}.table-row:last-child{border-bottom:0}.status-dot{width:8px;height:8px;flex:0 0 auto;border-radius:50%;background:#22C55E}.table-copy{display:flex;flex:1;flex-direction:column;margin-left:10px}.table-copy strong{color:var(--vault-color-text-1);font-size:14px;font-weight:600}.table-copy small{margin-top:2px;color:var(--vault-color-text-3);font-size:12px}.table-value{color:var(--vault-color-text-1);font-size:14px;font-weight:600}.empty-copy{margin:0;border-radius:12px;padding:18px 16px;background:var(--vault-color-surface);color:var(--vault-color-text-2);font-size:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}
</style>
