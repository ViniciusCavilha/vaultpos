<template>
  <ion-page>
    <ion-content fullscreen class="orders-page">
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content /></ion-refresher>
      <main class="page-shell">
        <h1>Comandas</h1>
        <div class="segments" role="tablist" aria-label="Status da comanda">
          <button v-for="segment in segments" :key="segment.value" type="button" :class="{ active: status === segment.value }" @click="selectStatus(segment.value)">{{ segment.label }}</button>
        </div>
        <section class="orders-list">
          <vault-skeleton v-if="comandasStore.loading" variant="list" />
          <vault-error-state v-else-if="comandasStore.error" :message="comandasStore.error" @retry="loadOrders" />
          <vault-empty-state v-else-if="!comandasStore.comandas.length" icon="receipt-outline" title="Nenhuma comanda" :message="emptyMessage" :button-text="status === 'aberta' ? 'Abrir Comanda' : null" @action="router.push('/garcom/comandas/nova')" />
          <template v-else>
            <button v-for="comanda in comandasStore.comandas" :key="comanda.id" class="order-card" type="button" @click="router.push(`/garcom/comandas/${comanda.id}`)">
              <span class="order-card__top"><span class="order-card__table"><i :class="`status-${comanda.status}`" /><strong>Mesa {{ comanda.mesa ?? '—' }}</strong></span><strong>{{ formatCurrency(comanda.total ?? comanda.subtotal ?? 0) }}</strong></span>
              <span class="order-card__bottom"><small>{{ comanda.usuarios?.nome || 'Garçom' }} · {{ formatTime(comanda.criada_em) }}</small><b :class="`status-${comanda.status}`">{{ statusLabel(comanda.status) }}</b></span>
            </button>
          </template>
        </section>
      </main>
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="new-order-fab"><ion-fab-button aria-label="Abrir comanda" @click="router.push('/garcom/comandas/nova')"><ion-icon :icon="add" /></ion-fab-button></ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonFab, IonFabButton, IonIcon, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import { add } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useComandasStore } from '@/stores/comandas.store'
type Status = 'aberta' | 'fechada' | 'cancelada'
const router = useRouter()
const comandasStore = useComandasStore()
const status = ref<Status>('aberta')
const segments: Array<{ label: string; value: Status }> = [{ label: 'Abertas', value: 'aberta' }, { label: 'Fechadas', value: 'fechada' }, { label: 'Canceladas', value: 'cancelada' }]
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const emptyMessage = computed(() => status.value === 'fechada' ? 'Nenhuma comanda fechada encontrada.' : status.value === 'cancelada' ? 'Nenhuma comanda cancelada encontrada.' : 'Não há comandas abertas agora.')
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : time.format(date) }
function statusLabel(value: Status) { return { aberta: 'Aberta', fechada: 'Fechada', cancelada: 'Cancelada' }[value] }
async function loadOrders() { await comandasStore.fetchComandas(status.value) }
async function selectStatus(value: Status) { status.value = value; await loadOrders() }
async function refresh(event: CustomEvent) { await loadOrders(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadOrders)
</script>

<style scoped>
.orders-page{--background:var(--vault-color-bg);--color:var(--vault-color-text-1)}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px 108px}h1{margin:0;color:var(--vault-color-text-1);font-size:24px;font-weight:700}.segments{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:16px;border-radius:10px;padding:3px;background:var(--vault-color-surface-muted)}.segments button{height:36px;border:0;border-radius:8px;background:transparent;color:var(--vault-color-text-3);font-family:inherit;font-size:13px}.segments button.active{background:var(--vault-color-surface);color:var(--vault-color-text-1);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.08)}.orders-list{margin-top:16px}.order-card{display:flex;width:100%;flex-direction:column;gap:8px;margin-bottom:8px;border:0;border-radius:12px;padding:16px;background:var(--vault-color-surface);box-shadow:0 1px 3px rgba(0,0,0,.06);text-align:left}.order-card__top,.order-card__bottom{display:flex;align-items:center;justify-content:space-between}.order-card__top>strong{color:var(--vault-color-text-1);font-size:15px;font-weight:700}.order-card__table{display:flex;align-items:center}.order-card__table i{width:8px;height:8px;border-radius:50%}.order-card__table strong{margin-left:8px;color:var(--vault-color-text-1);font-size:16px;font-weight:700}.order-card__bottom small{color:var(--vault-color-text-3);font-size:12px}.order-card__bottom b{font-size:11px;font-weight:600;text-transform:uppercase}.status-aberta{color:#22C55E;background-color:#22C55E}b.status-aberta{background:transparent}.status-fechada{color:var(--vault-color-text-3);background-color:var(--vault-color-text-3)}b.status-fechada{background:transparent}.status-cancelada{color:#EF4444;background-color:#EF4444}b.status-cancelada{background:transparent}.new-order-fab{margin-right:4px;margin-bottom:74px}.new-order-fab ion-fab-button{width:56px;height:56px;--background:#991B1B;--background-activated:#7F1D1D;--box-shadow:0 4px 12px rgba(153,27,27,.4)}.new-order-fab ion-icon{color:#FFFFFF;font-size:28px}
</style>
