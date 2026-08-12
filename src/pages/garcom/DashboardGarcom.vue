<template>
  <ion-page>
    <ion-content :fullscreen="true" class="page-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <main class="page-shell">
        <header class="dashboard-header">
          <div>
            <span class="greeting">{{ greeting }}</span>
            <h1>{{ userStore.nomeUsuario || 'Garçom' }}</h1>
            <span class="role">{{ roleLabel }}</span>
          </div>
          <button class="avatar-button" type="button" aria-label="Abrir perfil" @click="router.push('/garcom/perfil')">
            <VaultAvatar :name="userStore.nomeUsuario || 'Garçom'" size="md" />
          </button>
        </header>

        <button class="open-orders-card" type="button" @click="router.push('/garcom/comandas')">
          <strong>{{ comandasStore.totalComandasAbertas }}</strong>
          <span>comandas abertas</span>
          <small>Toque para ver todas →</small>
        </button>

        <VaultButton
          class="new-order"
          variant="outline"
          label="Abrir Nova Comanda"
          @click="router.push('/garcom/comandas/nova')"
        />

        <section class="tables-section">
          <h2>Suas mesas abertas</h2>
          <VaultSkeleton v-if="comandasStore.loading" variant="list" />
          <VaultErrorState
            v-else-if="comandasStore.error"
            :message="comandasStore.error"
            @retry="load"
          />
          <div v-else-if="myOpenOrders.length" class="orders-list">
            <button
              v-for="order in myOpenOrders"
              :key="order.id"
              class="order-row"
              type="button"
              @click="router.push('/garcom/comandas/' + order.id)"
            >
              <span class="status-dot"></span>
              <span class="order-main">
                <strong>Mesa {{ order.mesa ?? '-' }}</strong>
                <small>{{ formatTime(order.criada_em) }}</small>
              </span>
              <strong class="order-total">{{ formatMoney(order.total) }}</strong>
            </button>
          </div>
          <p v-else class="empty-copy">Você não possui mesas abertas agora.</p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import VaultAvatar from '@/components/common/VaultAvatar.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useComandasStore } from '@/stores/comandas.store'
import { useUserStore } from '@/stores/user.store'

const router = useRouter()
const userStore = useUserStore()
const comandasStore = useComandasStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia,'
  if (hour < 18) return 'Boa tarde,'
  return 'Boa noite,'
})
const roleLabel = computed(() => userStore.usuario?.cargo === 'garcom' ? 'Garçom' : 'Atendimento')
const myOpenOrders = computed(() => comandasStore.comandasAbertas.filter(
  (order) => !userStore.usuario || order.garcom_id === userStore.usuario.id,
))

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
async function load() {
  if (!userStore.usuario) await userStore.fetchUsuarioLogado()
  await comandasStore.fetchComandas('aberta')
}
async function refresh(event: CustomEvent) {
  await load()
  ;(event.target as HTMLIonRefresherElement).complete()
}
onMounted(load)
</script>

<style scoped>
.page-content { --background: #F8FAFC; }
.page-shell { min-height: 100%; padding: calc(56px + env(safe-area-inset-top)) 20px 32px; font-family: 'Inter', sans-serif; }
.dashboard-header { display: flex; align-items: center; justify-content: space-between; }
.greeting { color: #6B7280; font-size: 14px; }
h1 { margin: 2px 0 1px; color: #111827; font-size: 26px; font-weight: 700; letter-spacing: 0; }
.role { color: #9CA3AF; font-size: 13px; }
.avatar-button { padding: 0; border: 0; border-radius: 50%; background: transparent; }
.open-orders-card {
  display: flex;
  width: 100%;
  margin-top: 24px;
  padding: 24px;
  flex-direction: column;
  align-items: flex-start;
  border: 0;
  border-radius: 16px;
  background: #991B1B;
  color: #FFFFFF;
  text-align: left;
}
.open-orders-card strong { font-size: 48px; font-weight: 700; line-height: 1; }
.open-orders-card span { margin-top: 4px; color: rgba(255, 255, 255, 0.8); font-size: 14px; }
.open-orders-card small { margin-top: 8px; color: rgba(255, 255, 255, 0.6); font-size: 13px; }
.new-order { margin-top: 12px; }
.tables-section { margin-top: 28px; }
h2 { margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: 600; letter-spacing: 0; }
.orders-list { border-radius: 12px; background: #FFFFFF; }
.order-row { display: flex; width: 100%; align-items: center; gap: 10px; padding: 14px 16px; border: 0; border-bottom: 1px solid #F3F4F6; background: transparent; text-align: left; }
.order-row:last-child { border-bottom: 0; }
.status-dot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: #22C55E; }
.order-main { display: flex; flex: 1; flex-direction: column; }
.order-main strong, .order-total { color: #111827; font-size: 14px; font-weight: 600; }
.order-main small { margin-top: 2px; color: #9CA3AF; font-size: 12px; }
.empty-copy { margin: 18px 0; color: #9CA3AF; font-size: 14px; text-align: center; }
</style>
