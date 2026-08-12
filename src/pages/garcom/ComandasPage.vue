<template>
  <ion-page>
    <ion-content :fullscreen="true" class="page-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <main class="page-shell">
        <h1>Comandas</h1>

        <div class="segments" role="tablist">
          <button
            v-for="segment in segments"
            :key="segment.value"
            type="button"
            :class="{ active: selectedStatus === segment.value }"
            @click="selectStatus(segment.value)"
          >
            {{ segment.label }}
          </button>
        </div>

        <section class="orders">
          <VaultSkeleton v-if="comandasStore.loading" variant="list" />
          <VaultErrorState
            v-else-if="comandasStore.error"
            :message="comandasStore.error"
            @retry="load"
          />
          <VaultEmptyState
            v-else-if="!comandasStore.comandas.length"
            icon="receipt-outline"
            title="Nenhuma comanda"
            :message="emptyMessage"
            button-text="Abrir Comanda"
            @action="router.push('/garcom/comandas/nova')"
          />
          <button
            v-for="order in comandasStore.comandas"
            v-else
            :key="order.id"
            class="order-card"
            type="button"
            @click="router.push('/garcom/comandas/' + order.id)"
          >
            <span class="order-top">
              <span class="table-name">
                <span class="status-dot" :class="order.status"></span>
                Mesa {{ order.mesa ?? '-' }}
              </span>
              <strong>{{ formatMoney(order.total) }}</strong>
            </span>
            <span class="order-bottom">
              <span>{{ order.usuarios?.nome ?? 'Garçom' }} · {{ formatTime(order.criada_em) }}</span>
              <span class="status-text" :class="order.status">{{ statusLabel(order.status) }}</span>
            </span>
          </button>
        </section>
      </main>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="orders-fab">
        <ion-fab-button aria-label="Abrir nova comanda" @click="router.push('/garcom/comandas/nova')">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue'
import { add } from 'ionicons/icons'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useComandasStore } from '@/stores/comandas.store'
import { useUserStore } from '@/stores/user.store'
import type { StatusComanda } from '@/types/database.types'

const router = useRouter()
const userStore = useUserStore()
const comandasStore = useComandasStore()
const selectedStatus = ref<StatusComanda>('aberta')
const segments: { label: string; value: StatusComanda }[] = [
  { label: 'Abertas', value: 'aberta' },
  { label: 'Fechadas', value: 'fechada' },
  { label: 'Canceladas', value: 'cancelada' },
]
const emptyMessage = computed(() => selectedStatus.value === 'aberta'
  ? 'Não há comandas abertas agora.'
  : 'Nenhuma comanda encontrada neste status.')

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
function statusLabel(status: StatusComanda) {
  return { aberta: 'Aberta', fechada: 'Fechada', cancelada: 'Cancelada' }[status]
}
async function load() {
  if (!userStore.usuario) await userStore.fetchUsuarioLogado()
  await comandasStore.fetchComandas(selectedStatus.value)
}
async function selectStatus(status: StatusComanda) {
  selectedStatus.value = status
  await load()
}
async function refresh(event: CustomEvent) {
  await load()
  ;(event.target as HTMLIonRefresherElement).complete()
}
onMounted(load)
</script>

<style scoped>
.page-content { --background: #F8FAFC; }
.page-shell { min-height: 100%; padding: calc(56px + env(safe-area-inset-top)) 20px 120px; font-family: 'Inter', sans-serif; }
h1 { margin: 0; color: #111827; font-size: 24px; font-weight: 700; letter-spacing: 0; }
.segments { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 16px; padding: 3px; border-radius: 10px; background: #F3F4F6; }
.segments button { height: 36px; border: 0; border-radius: 8px; background: transparent; color: #9CA3AF; font: 400 13px 'Inter', sans-serif; }
.segments button.active { background: #FFFFFF; color: #111827; font-weight: 600; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.orders { margin-top: 16px; }
.order-card { display: flex; width: 100%; margin-bottom: 8px; padding: 16px; flex-direction: column; gap: 9px; border: 0; border-radius: 12px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); text-align: left; }
.order-top, .order-bottom { display: flex; align-items: center; justify-content: space-between; }
.table-name { display: flex; align-items: center; gap: 8px; color: #111827; font-size: 16px; font-weight: 700; }
.order-top > strong { color: #111827; font-size: 15px; font-weight: 700; }
.order-bottom { color: #9CA3AF; font-size: 12px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.aberta { background: #22C55E; }
.status-dot.fechada { background: #9CA3AF; }
.status-dot.cancelada { background: #EF4444; }
.status-text { font-size: 11px; font-weight: 600; text-transform: uppercase; }
.status-text.aberta { color: #22C55E; }
.status-text.fechada { color: #9CA3AF; }
.status-text.cancelada { color: #EF4444; }
.orders-fab { margin-right: 4px; margin-bottom: 74px; }
.orders-fab ion-fab-button { width: 56px; height: 56px; --background: #991B1B; --background-activated: #7F1D1D; --box-shadow: 0 4px 12px rgba(153, 27, 27, 0.4); --color: #FFFFFF; }
.orders-fab ion-icon { width: 28px; height: 28px; }
</style>
