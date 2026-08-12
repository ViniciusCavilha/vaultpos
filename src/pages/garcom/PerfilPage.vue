<template>
  <ion-page>
    <ion-content fullscreen class="profile-page">
      <main class="page-shell">
        <header><h1>Meu Perfil</h1><button type="button" @click="editPhone">Editar</button></header>
        <vault-skeleton v-if="userStore.loading" variant="avatar" />
        <vault-error-state v-else-if="userStore.error && !displayName" :message="userStore.error" @retry="loadProfile" />
        <template v-else>
          <section class="identity">
            <vault-avatar :name="displayName" size="lg" />
            <div><h2>{{ displayName }}</h2><p>{{ displayRole }} · Ativo</p><span><i />Online agora</span></div>
          </section>
          <section class="stats-card">
            <div><strong>{{ todayOrders.length }}</strong><span>Comandas hoje</span></div>
            <div><strong>{{ uniqueTables }}</strong><span>Mesas atendidas</span></div>
            <div><strong>{{ compactCurrency(todaySales) }}</strong><span>Vendas hoje</span></div>
          </section>
          <profile-section title="DADOS PESSOAIS">
            <button class="info-row" type="button" @click="editPhone"><ion-icon :icon="callOutline" /><span><small>TELEFONE</small><b>{{ phone }}</b></span><ion-icon class="trailing" :icon="chevronForwardOutline" /></button>
            <div class="info-row"><ion-icon :icon="mailOutline" /><span><small>E-MAIL</small><b>{{ email }}</b></span><vault-badge variant="sucesso" label="Verificado" /></div>
          </profile-section>
          <profile-section title="TRABALHO">
            <div class="info-row"><ion-icon :icon="peopleOutline" /><span><small>CARGO</small><b>{{ displayRole }}</b></span></div>
            <div class="info-row"><ion-icon :icon="pulseOutline" /><span><small>STATUS</small><b class="accent">Ativo no sistema</b></span></div>
            <div class="info-row"><ion-icon :icon="cashOutline" /><span><small>MEMBRO DESDE</small><b>{{ memberSince }}</b></span></div>
          </profile-section>
          <profile-section title="NOTIFICAÇÕES">
            <div v-for="option in notificationOptions" :key="option.key" class="toggle-row"><span><b>{{ option.title }}</b><small>{{ option.subtitle }}</small></span><ion-toggle v-model="notifications[option.key]" @ion-change="saveNotifications" /></div>
          </profile-section>
          <button class="delete-account-button" type="button" @click="deleteConfirmOpen = true"><ion-icon :icon="trashOutline" />Excluir conta</button>
          <button class="logout-button" type="button" @click="confirmLogout">Sair</button>
        </template>
      </main>
    </ion-content>

    <ion-modal :is-open="deleteConfirmOpen" class="delete-modal" @did-dismiss="deleteConfirmOpen = false">
      <ion-content class="delete-modal-content">
        <section class="delete-card">
          <span class="delete-icon"><ion-icon :icon="trashOutline" /></span>
          <h2>Excluir conta?</h2>
          <p>Seu acesso e perfil serão removidos do VaultPOS. Essa ação não pode ser desfeita.</p>
          <div class="delete-actions">
            <button class="cancel-delete" type="button" :disabled="authStore.loading" @click="deleteConfirmOpen = false">Cancelar</button>
            <button class="confirm-delete" type="button" :disabled="authStore.loading" @click="deleteAccount">{{ authStore.loading ? 'Excluindo...' : 'Sim, excluir' }}</button>
          </div>
        </section>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonModal, IonPage, IonToggle, alertController } from '@ionic/vue'
import { callOutline, cashOutline, chevronForwardOutline, mailOutline, peopleOutline, pulseOutline, trashOutline } from 'ionicons/icons'
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultAvatar from '@/components/common/VaultAvatar.vue'
import VaultBadge from '@/components/common/VaultBadge.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { useAuthStore } from '@/stores/auth.store'
import { useComandasStore } from '@/stores/comandas.store'
import { useUserStore } from '@/stores/user.store'

const ProfileSection = defineComponent({ props: { title: { type: String, required: true } }, setup(props, { slots }) { return () => h('section', { class: 'profile-section' }, [h('h3', props.title), h('div', { class: 'section-card' }, slots.default?.())]) } })
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const comandasStore = useComandasStore()
const { showToast } = useVaultToast()
const deleteConfirmOpen = ref(false)
const displayName = computed(() => userStore.nomeUsuario || String(authStore.user?.user_metadata?.full_name || 'Garçom'))
const email = computed(() => userStore.usuario?.email || authStore.userEmail || '—')
const phone = computed(() => userStore.usuario?.telefone || String(authStore.user?.user_metadata?.phone || 'Não informado'))
const displayRole = computed(() => userStore.usuario?.cargo === 'admin' ? 'Administrador' : 'Garçom')
const memberSince = computed(() => {
  const raw = (userStore.usuario as unknown as { criado_em?: string } | null)?.criado_em
  if (!raw) return '—'
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
})
const todayOrders = computed(() => {
  const waiterId = userStore.usuario?.id
  if (!waiterId) return []
  const today = new Date().toDateString()
  return comandasStore.comandas.filter((item) => item.garcom_id === waiterId && new Date(item.criada_em).toDateString() === today)
})
const uniqueTables = computed(() => new Set(todayOrders.value.map((item) => item.mesa).filter(Boolean)).size)
const todaySales = computed(() => todayOrders.value.reduce((sum, item) => sum + Number(item.total || 0), 0))
const notifications = reactive<Record<'orders' | 'payments' | 'stock', boolean>>({ orders: true, payments: true, stock: false })
const notificationOptions = [
  { key: 'orders' as const, title: 'Novas comandas', subtitle: 'Alertas quando uma mesa é aberta' },
  { key: 'payments' as const, title: 'Pagamentos', subtitle: 'Confirmação de fechamento de mesa' },
  { key: 'stock' as const, title: 'Estoque baixo', subtitle: 'Aviso quando produto está acabando' },
]
function compactCurrency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value) }
function saveNotifications() { localStorage.setItem('vaultpos-notifications', JSON.stringify(notifications)) }
function loadNotifications() {
  const saved = localStorage.getItem('vaultpos-notifications')
  if (!saved) return
  try { Object.assign(notifications, JSON.parse(saved)) } catch { localStorage.removeItem('vaultpos-notifications') }
}
async function loadProfile() { await Promise.all([userStore.fetchUsuarioLogado(), comandasStore.fetchComandas()]) }
async function editPhone() {
  if (!userStore.usuario) { await showToast('Perfil local: telefone não pode ser sincronizado.', 'info'); return }
  const alert = await alertController.create({ header: 'Editar telefone', inputs: [{ name: 'phone', type: 'tel', value: phone.value, placeholder: '(11) 99999-9999' }], buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Salvar', handler: async (data) => { try { await userStore.updatePerfil({ telefone: String(data.phone || '').trim() }); await showToast('Telefone atualizado.', 'success') } catch { await showToast(userStore.error || 'Não foi possível atualizar.', 'error') } } }] })
  await alert.present()
}
async function confirmLogout() {
  const alert = await alertController.create({ header: 'Sair?', message: 'Deseja encerrar sua sessão?', buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Sim, sair', role: 'destructive', handler: async () => { await authStore.logout(); userStore.clear(); await router.replace('/login') } }] })
  await alert.present()
}
async function deleteAccount() {
  try {
    await authStore.deleteAccount(userStore.empresaId)
    deleteConfirmOpen.value = false
    userStore.clear()
    await showToast('Conta excluída com sucesso.', 'success')
    await router.replace('/login')
  } catch {
    await showToast(authStore.error || 'Não foi possível excluir a conta.', 'error')
  }
}
onMounted(async () => { loadNotifications(); await loadProfile() })
</script>

<style scoped>
.profile-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(104px + env(safe-area-inset-bottom))}header{display:flex;align-items:center;justify-content:space-between}header h1{margin:0;font-size:24px;font-weight:700}header button{border:0;border-radius:8px;padding:6px 14px;background:#F3F4F6;color:#111827;font:600 13px Inter}.identity{display:flex;align-items:center;margin-top:20px}.identity :deep(.vault-avatar){width:64px;height:64px;font-size:28px}.identity>div{margin-left:16px}.identity h2{margin:0;font-size:20px;font-weight:700}.identity p{margin:3px 0 0;color:#6B7280;font-size:13px}.identity span{display:flex;align-items:center;margin-top:4px;color:#22C55E;font-size:12px}.identity i{width:8px;height:8px;margin-right:6px;border-radius:50%;background:#22C55E}.stats-card{display:grid;grid-template-columns:repeat(3,1fr);margin-top:16px;border-radius:12px;padding:16px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06)}.stats-card div{display:flex;flex-direction:column;align-items:center;border-right:1px solid #F3F4F6;text-align:center}.stats-card div:last-child{border:0}.stats-card strong{font-size:22px;font-weight:700}.stats-card span{margin-top:3px;color:#9CA3AF;font-size:11px}.profile-section{display:block;margin-top:24px}.profile-section h3{margin:0 0 8px;color:#9CA3AF;font-size:11px;font-weight:600;letter-spacing:.5px}.section-card{overflow:hidden;border-radius:12px;background:#FFFFFF}.info-row,.toggle-row{display:flex;width:100%;min-height:68px;align-items:center;border:0;border-bottom:1px solid #F9FAFB;padding:16px;background:#FFFFFF;text-align:left}.info-row:last-child,.toggle-row:last-child{border-bottom:0}.info-row>ion-icon{flex:0 0 auto;color:#9CA3AF;font-size:20px}.info-row>span{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.info-row small{color:#9CA3AF;font-size:10px;letter-spacing:.5px}.info-row b{overflow:hidden;margin-top:3px;color:#111827;font-size:14px;font-weight:400;text-overflow:ellipsis}.info-row b.accent{color:#991B1B}.info-row .trailing{color:#D1D5DB;font-size:16px}.toggle-row{justify-content:space-between}.toggle-row>span{display:flex;min-width:0;flex-direction:column;padding-right:12px}.toggle-row b{font-size:14px;font-weight:600}.toggle-row small{margin-top:3px;color:#9CA3AF;font-size:13px}.toggle-row ion-toggle{--track-background-checked:#991B1B;--handle-background-checked:#FFFFFF}.delete-account-button,.logout-button{display:flex;align-items:center;justify-content:center;margin:28px auto 0;border:0;padding:8px;background:transparent;color:#EF4444;font:600 15px Inter}.delete-account-button ion-icon{margin-right:6px;font-size:18px}.logout-button{margin-top:8px;color:#6B7280}.delete-modal{--background:rgba(17,24,39,.42);--width:100%;--height:100%}.delete-modal-content{--background:transparent;--padding-start:24px;--padding-end:24px}.delete-modal-content::part(scroll){display:grid;min-height:100%;place-items:center}.delete-card{width:min(360px,100%);border-radius:20px;padding:24px;background:#FFFFFF;box-shadow:0 18px 45px rgba(17,24,39,.18);text-align:center}.delete-icon{display:grid;width:54px;height:54px;margin:0 auto 14px;place-items:center;border-radius:50%;background:#FEF2F2;color:#EF4444}.delete-icon ion-icon{font-size:24px}.delete-card h2{margin:0;color:#111827;font-size:20px}.delete-card p{margin:8px 0 0;color:#6B7280;font-size:14px;line-height:1.45}.delete-actions{display:grid;grid-template-columns:1fr;gap:10px;margin-top:22px}.delete-actions button{height:48px;border:0;border-radius:12px;font:600 14px Inter}.cancel-delete{background:#F3F4F6;color:#111827}.confirm-delete{background:#EF4444;color:#FFFFFF}.delete-actions button:disabled{opacity:.7}
:deep(.profile-section h3){margin:0 0 8px;color:#9CA3AF;font-size:11px;font-weight:600;letter-spacing:.5px}
:deep(.section-card){overflow:hidden;border-radius:12px;background:#FFFFFF}
</style>
