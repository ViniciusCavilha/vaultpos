<template>
  <ion-page>
    <ion-content fullscreen class='users-page'>
      <ion-refresher slot='fixed' @ion-refresh='refresh'><ion-refresher-content /></ion-refresher>
      <main class='page-shell'>
        <header><h1>Usuários</h1><button type='button' aria-label='Novo usuário' @click='openCreate'><ion-icon :icon='add' /></button></header>
        <vault-skeleton v-if='loading' variant='list' />
        <vault-error-state v-else-if='errorMessage' :message='errorMessage' @retry='loadUsers' />
        <vault-empty-state v-else-if='!users.length' icon='people-outline' title='Sem usuários' message='Nenhum usuário cadastrado além de você.' button-text='Adicionar Usuário' @action='openCreate' />
        <section v-else class='user-list'><button v-for='user in users' :key='user.id' type='button' @click='openEdit(user)'><vault-avatar :name='user.nome' size='md' /><span><strong>{{ user.nome }} <i :class='user.cargo'>{{ user.cargo === 'admin' ? 'Admin' : 'Garçom' }}</i></strong><small>{{ user.email }}</small></span><ion-toggle :checked='user.ativo' @click.stop @ion-change='toggleUser(user, $event)' /></button></section>
      </main>

      <ion-modal :is-open='modalOpen' @did-dismiss='closeModal'>
        <ion-page><ion-content fullscreen class='user-modal'><header><h2>{{ selectedUser ? 'Editar Usuário' : 'Novo Usuário' }}</h2><button type='button' @click='closeModal'><ion-icon :icon='closeOutline' /></button></header>
          <form @submit.prevent='saveUser'>
            <label><span>Nome completo *</span><input v-model='form.name' type='text' autocomplete='name' placeholder='Nome completo' /></label>
            <label><span>E-mail *</span><input v-model='form.email' type='email' inputmode='email' autocomplete='email' placeholder='seu@email.com' :disabled='Boolean(selectedUser)' /></label>
            <label><span>Telefone</span><input v-model='form.phone' type='tel' inputmode='tel' autocomplete='tel' placeholder='(11) 99999-9999' /></label>
            <fieldset><legend>Cargo</legend><div><button type='button' class='admin' :class='{ active: form.role === `admin` }' @click='form.role = `admin`'>Admin</button><button type='button' class='waiter' :class='{ active: form.role === `garcom` }' @click='form.role = `garcom`'>Garçom</button></div></fieldset>
            <label v-if='!selectedUser'><span>Senha *</span><input v-model='form.password' type='password' minlength='8' autocomplete='new-password' placeholder='Mínimo 8 caracteres' /></label>
            <p v-if='formError' class='form-error'>{{ formError }}</p>
            <vault-button label='Salvar' loading-label='Salvando...' :loading='saving' @click='saveUser' />
            <vault-button v-if='selectedUser && selectedUser.ativo' class='deactivate-button' variant='outline' label='Desativar usuário' :disabled='saving' @click='confirmDeactivate' />
          </form>
        </ion-content></ion-page>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonModal, IonPage, IonRefresher, IonRefresherContent, IonToggle, alertController } from '@ionic/vue'
import { createClient } from '@supabase/supabase-js'
import { add, closeOutline } from 'ionicons/icons'
import { onMounted, reactive, ref } from 'vue'
import VaultAvatar from '@/components/common/VaultAvatar.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { supabase } from '@/supabase/client'
import { createUsuario, updateUsuario } from '@/supabase/queries/usuarios'
import { useUserStore } from '@/stores/user.store'
import type { CargoUsuario, Usuario } from '@/types/database.types'

const userStore = useUserStore()
const { showToast } = useVaultToast()
const users = ref<Usuario[]>([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const formError = ref('')
const modalOpen = ref(false)
const selectedUser = ref<Usuario | null>(null)
const form = reactive({ name: '', email: '', phone: '', role: 'garcom' as CargoUsuario, password: '' })
async function loadUsers() { if (!userStore.empresaId) { users.value = []; errorMessage.value = ''; return } loading.value = true; errorMessage.value = ''; try { const { data, error } = await supabase.from('usuarios').select('*').eq('empresa_id', userStore.empresaId).order('nome'); if (error) throw error; users.value = data } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Erro ao carregar usuários.' } finally { loading.value = false } }
function resetForm(user: Usuario | null) { form.name = user?.nome || ''; form.email = user?.email || ''; form.phone = user?.telefone || ''; form.role = user?.cargo || 'garcom'; form.password = ''; formError.value = '' }
function openCreate() { selectedUser.value = null; resetForm(null); modalOpen.value = true }
function openEdit(user: Usuario) { selectedUser.value = user; resetForm(user); modalOpen.value = true }
function closeModal() { modalOpen.value = false; selectedUser.value = null }
function validate() { if (!form.name.trim() || !form.email.trim()) return 'Preencha nome e e-mail.'; if (!selectedUser.value && form.password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'; return '' }
async function saveUser() {
  formError.value = validate(); if (formError.value || saving.value || !userStore.empresaId) return; saving.value = true
  const editing = Boolean(selectedUser.value)
  try {
    if (selectedUser.value) await updateUsuario(selectedUser.value.id, { nome: form.name.trim(), telefone: form.phone.trim() || null, cargo: form.role })
    else { const isolatedAuth = createClient(import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co', import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key', { auth: { persistSession: false, autoRefreshToken: false } }); const { data, error } = await isolatedAuth.auth.signUp({ email: form.email.trim(), password: form.password, options: { data: { full_name: form.name.trim(), role: form.role } } }); if (error) throw error; if (!data.user) throw new Error('Não foi possível criar a conta de acesso.'); await createUsuario({ empresa_id: userStore.empresaId, nome: form.name.trim(), email: form.email.trim(), telefone: form.phone.trim() || null, cargo: form.role, foto: null, ativo: true }) }
    await loadUsers(); closeModal(); await showToast(editing ? 'Usuário atualizado!' : 'Usuário criado com sucesso!', 'success')
  } catch (error) { await showToast(error instanceof Error ? error.message : 'Erro ao salvar usuário.', 'error') } finally { saving.value = false }
}
async function setActive(user: Usuario, active: boolean) { try { await updateUsuario(user.id, { ativo: active }); user.ativo = active; await showToast(`Usuário ${active ? 'ativado' : 'desativado'}`, 'success') } catch (error) { await showToast(error instanceof Error ? error.message : 'Erro ao atualizar usuário.', 'error') } }
async function toggleUser(user: Usuario, event: CustomEvent) { const active = Boolean(event.detail.checked); if (active === user.ativo) return; await setActive(user, active) }
async function confirmDeactivate() { if (!selectedUser.value) return; const user = selectedUser.value; const alert = await alertController.create({ header: 'Desativar usuário?', message: `${user.nome} perderá o acesso ao sistema.`, buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Desativar', role: 'destructive', handler: async () => { await setActive(user, false); closeModal() } }] }); await alert.present() }
async function refresh(event: CustomEvent) { await loadUsers(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadUsers)
</script>

<style scoped>
.users-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px 36px}.page-shell>header{display:flex;align-items:center;justify-content:space-between}.page-shell>header h1{margin:0;font-size:24px;font-weight:700}.page-shell>header button{display:grid;width:40px;height:40px;place-items:center;border:0;border-radius:50%;background:#991B1B;color:#FFFFFF}.user-list{overflow:hidden;margin-top:16px;border-radius:12px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06)}.user-list>button{display:flex;width:100%;align-items:center;border:0;border-bottom:1px solid #F9FAFB;padding:16px;background:#FFFFFF;text-align:left}.user-list>button:last-child{border:0}.user-list>button>span{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.user-list strong{overflow:hidden;color:#111827;font-size:15px;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.user-list strong i{display:inline-block;margin-left:5px;border-radius:6px;padding:2px 8px;background:#FEF2F2;color:#991B1B;font-size:11px;font-style:normal}.user-list strong i.garcom{background:#EFF6FF;color:#0EA5E9}.user-list small{margin-top:3px;color:#9CA3AF;font-size:12px}.user-list ion-toggle{--track-background-checked:#991B1B}.user-modal{--background:#F8FAFC;--color:#111827}.user-modal header{display:flex;align-items:center;justify-content:space-between;padding:calc(24px + env(safe-area-inset-top)) 20px 16px}.user-modal header h2{margin:0;font-size:20px}.user-modal header button{display:grid;width:32px;height:32px;place-items:center;border:0;border-radius:50%;background:#F3F4F6}.user-modal form{display:grid;gap:16px;padding:0 20px 32px}.user-modal label,.user-modal legend{color:#6B7280;font-size:13px}.user-modal label>span{display:block;margin-bottom:6px}.user-modal input{width:100%;height:52px;border:1px solid #E5E7EB;border-radius:10px;outline:0;padding:0 16px;background:#FFFFFF;color:#111827;font:400 14px Inter}.user-modal input:disabled{color:#9CA3AF;background:#F3F4F6}.user-modal fieldset{margin:0;border:0;padding:0}.user-modal fieldset>div{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:6px}.user-modal fieldset button{height:48px;border:1px solid #E5E7EB;border-radius:10px;background:#F3F4F6;color:#6B7280;font:600 14px Inter}.user-modal fieldset button.admin.active{border-color:#991B1B;background:#FEF2F2;color:#991B1B}.user-modal fieldset button.waiter.active{border-color:#0EA5E9;background:#EFF6FF;color:#0EA5E9}.form-error{margin:0;color:#EF4444;font-size:12px}.deactivate-button :deep(.vault-button){--border-color:#EF4444;--color:#EF4444}
</style>
