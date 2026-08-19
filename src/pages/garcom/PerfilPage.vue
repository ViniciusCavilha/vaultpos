<template>
  <ion-page>
    <ion-content :fullscreen="true" class="page-content">
      <main class="page-shell">
        <VaultSkeleton v-if="userStore.loading && !userStore.usuario" variant="avatar" />
        <VaultErrorState v-else-if="userStore.error && !userStore.usuario" :message="userStore.error" @retry="load" />
        <template v-else>
          <header class="page-header">
            <h1>Meu Perfil</h1>
            <button type="button" @click="toggleEdit">{{ editing ? 'Cancelar' : 'Editar' }}</button>
          </header>

          <section class="identity">
            <div class="profile-avatar">{{ initial }}</div>
            <div>
              <h2>{{ userStore.nomeUsuario || 'Garçom' }}</h2>
              <p>Garçom · Ativo</p>
              <span><i></i>Online agora</span>
            </div>
          </section>

          <section class="stats-card">
            <div><strong>{{ todayOrders.length }}</strong><span>Comandas hoje</span></div>
            <div><strong>{{ servedTables }}</strong><span>Mesas atendidas</span></div>
            <div><strong>{{ compactMoney(todaySales) }}</strong><span>Vendas hoje</span></div>
          </section>

          <section class="profile-section">
            <h3>Dados pessoais</h3>
            <div class="info-card">
              <div class="info-row">
                <ion-icon :icon="callOutline" />
                <span><small>Telefone</small>
                  <input v-if="editing" v-model="phone" type="tel" />
                  <b v-else>{{ userStore.usuario?.telefone || 'Não informado' }}</b>
                </span>
                <ion-icon v-if="!editing" class="chevron" :icon="chevronForward" />
              </div>
              <div class="info-row">
                <ion-icon :icon="mailOutline" />
                <span><small>E-mail</small><b>{{ userStore.usuario?.email || '-' }}</b></span>
                <VaultBadge variant="sucesso" label="Verificado" />
              </div>
            </div>
            <VaultButton v-if="editing" class="save-profile" label="Salvar alterações" :loading="userStore.loading" @click="saveProfile" />
          </section>

          <section class="profile-section">
            <h3>Trabalho</h3>
            <div class="info-card">
              <div class="info-row"><ion-icon :icon="peopleOutline" /><span><small>Cargo</small><b>Garçom</b></span></div>
              <div class="info-row"><ion-icon :icon="pulseOutline" /><span><small>Turno</small><b class="accent">Noite (18h – 00h)</b></span></div>
              <div class="info-row"><ion-icon :icon="calendarOutline" /><span><small>Membro desde</small><b>{{ memberSince }}</b></span></div>
            </div>
          </section>

          <section class="profile-section">
            <h3>Notificações</h3>
            <div class="info-card">
              <label class="notification-row">
                <span><b>Novas comandas</b><small>Alertas quando uma mesa é aberta</small></span>
                <ion-toggle v-model="notifications.orders" @ion-change="saveNotifications" />
              </label>
              <label class="notification-row">
                <span><b>Pagamentos</b><small>Confirmação de fechamento de mesa</small></span>
                <ion-toggle v-model="notifications.payments" @ion-change="saveNotifications" />
              </label>
              <label class="notification-row">
                <span><b>Estoque baixo</b><small>Aviso quando produto está acabando</small></span>
                <ion-toggle v-model="notifications.stock" @ion-change="saveNotifications" />
              </label>
            </div>
          </section>

          <button class="logout-button" type="button" @click="logoutAlertOpen = true">Sair</button>
        </template>
      </main>

      <ion-alert
        :is-open="logoutAlertOpen"
        header="Sair?"
        message="Deseja encerrar sua sessão?"
        :buttons="logoutButtons"
        @did-dismiss="logoutAlertOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonAlert, IonContent, IonIcon, IonPage, IonToggle, useIonRouter } from '@ionic/vue'
import {
  calendarOutline,
  callOutline,
  chevronForward,
  mailOutline,
  peopleOutline,
  pulseOutline,
} from 'ionicons/icons'
import VaultBadge from '@/components/common/VaultBadge.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { useAuthStore } from '@/stores/auth.store'
import { useComandasStore } from '@/stores/comandas.store'
import { useUserStore } from '@/stores/user.store'

const ionRouter = useIonRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const comandasStore = useComandasStore()
const { showToast } = useVaultToast()
const editing = ref(false)
const phone = ref('')
const logoutAlertOpen = ref(false)
const notifications = reactive({ orders: true, payments: true, stock: false })
const logoutButtons = [
  { text: 'Cancelar', role: 'cancel' },
  { text: 'Sim, sair', role: 'destructive', handler: () => logout() },
]
const initial = computed(() => userStore.nomeUsuario.trim().charAt(0).toLocaleUpperCase('pt-BR') || 'G')
const todayOrders = computed(() => {
  const today = new Date().toDateString()
  return comandasStore.comandas.filter((order) =>
    order.garcom_id === userStore.usuario?.id && new Date(order.criada_em).toDateString() === today,
  )
})
const servedTables = computed(() => new Set(todayOrders.value.map((order) => order.mesa).filter(Boolean)).size)
const todaySales = computed(() => todayOrders.value.reduce((sum, order) => sum + (order.total ?? 0), 0))
const memberSince = computed(() => {
  const date = (userStore.usuario as any)?.criado_em
  return date ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(date)) : 'Não informado'
})

function compactMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}
function toggleEdit() {
  editing.value = !editing.value
  phone.value = userStore.usuario?.telefone ?? ''
}
async function saveProfile() {
  try {
    await userStore.updatePerfil({ telefone: phone.value.trim() })
    editing.value = false
    await showToast('Perfil atualizado!', 'success')
  } catch (error) {
    await showToast(error instanceof Error ? error.message : 'Erro ao atualizar perfil.', 'error')
  }
}
function saveNotifications() {
  localStorage.setItem('vaultpos-garcom-notifications', JSON.stringify(notifications))
}
async function logout() {
  logoutAlertOpen.value = false
  await authStore.logout()
  userStore.clear()
  ionRouter.navigate('/login', 'root', 'replace')
}
async function load() {
  if (!userStore.usuario) await userStore.fetchUsuarioLogado()
  await comandasStore.fetchComandas()
  phone.value = userStore.usuario?.telefone ?? ''
}
onMounted(async () => {
  const saved = localStorage.getItem('vaultpos-garcom-notifications')
  if (saved) Object.assign(notifications, JSON.parse(saved))
  await load()
})
</script>

<style scoped>
.page-content { --background: #F8FAFC; }
.page-shell { min-height: 100%; padding: calc(56px + env(safe-area-inset-top)) 20px 40px; font-family: 'Inter', sans-serif; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-header h1 { margin: 0; color: #111827; font-size: 24px; font-weight: 700; letter-spacing: 0; }
.page-header button { padding: 6px 14px; border: 0; border-radius: 8px; background: #F3F4F6; color: #111827; font: 600 13px 'Inter', sans-serif; }
.identity { display: flex; align-items: center; gap: 16px; margin-top: 20px; }
.profile-avatar { display: grid; width: 64px; height: 64px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: #FEF2F2; color: #991B1B; font-size: 28px; font-weight: 700; }
.identity h2 { margin: 0; color: #111827; font-size: 20px; font-weight: 700; }
.identity p { margin: 3px 0 0; color: #6B7280; font-size: 13px; }
.identity span { display: flex; align-items: center; gap: 5px; margin-top: 4px; color: #22C55E; font-size: 12px; }
.identity i { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; }
.stats-card { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 16px; padding: 16px 0; border-radius: 12px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.stats-card div { display: flex; min-width: 0; padding: 0 8px; flex-direction: column; align-items: center; border-right: 1px solid #F3F4F6; text-align: center; }
.stats-card div:last-child { border-right: 0; }
.stats-card strong { color: #111827; font-size: 20px; font-weight: 700; }
.stats-card span { margin-top: 3px; color: #9CA3AF; font-size: 11px; }
.profile-section { margin-top: 24px; }
.profile-section h3 { margin: 0 0 8px; color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.info-card { overflow: hidden; border-radius: 12px; background: #FFFFFF; }
.info-row { display: flex; min-height: 66px; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #F9FAFB; }
.info-row:last-child { border-bottom: 0; }
.info-row > ion-icon { width: 20px; height: 20px; flex: 0 0 auto; color: #9CA3AF; }
.info-row > span { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.info-row small { color: #9CA3AF; font-size: 10px; text-transform: uppercase; }
.info-row b { overflow: hidden; color: #111827; font-size: 14px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.info-row b.accent { color: #991B1B; }
.info-row input { height: 32px; padding: 0; border: 0; border-bottom: 1px solid #991B1B; outline: 0; color: #111827; font: 400 14px 'Inter', sans-serif; }
.info-row .chevron { width: 16px; height: 16px; color: #D1D5DB; }
.save-profile { margin-top: 12px; }
.notification-row { display: flex; min-height: 74px; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #F9FAFB; }
.notification-row:last-child { border-bottom: 0; }
.notification-row > span { display: flex; flex-direction: column; gap: 4px; }
.notification-row b { color: #111827; font-size: 14px; font-weight: 600; }
.notification-row small { color: #9CA3AF; font-size: 12px; line-height: 1.3; }
.notification-row ion-toggle { flex: 0 0 auto; --track-background-checked: #991B1B; }
.logout-button { display: block; margin: 32px auto 0; border: 0; background: transparent; color: #EF4444; font: 600 15px 'Inter', sans-serif; }
</style>
