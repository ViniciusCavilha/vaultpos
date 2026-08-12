<template>
  <ion-page>
    <ion-content fullscreen class='settings-page'>
      <main class='page-shell'>
        <h1>Configurações</h1>
        <vault-skeleton v-if='userStore.loading' variant='avatar' />
        <vault-error-state v-else-if='userStore.error && !displayName' :message='userStore.error' @retry='userStore.fetchUsuarioLogado' />
        <template v-else>
          <article class='profile-card'><vault-avatar :name='displayName' size='lg' /><span><strong>{{ displayName }}</strong><small>Administrador</small></span><button type='button' @click='editProfile'>Editar perfil</button></article>
          <settings-section title='PREFERÊNCIAS'>
            <div class='setting-row disabled'><ion-icon :icon='moonOutline' /><span><strong>Tema</strong><small>Modo escuro</small></span><vault-badge variant='neutro' label='Em breve' /><ion-toggle :checked='false' disabled /></div>
            <div class='setting-row'><ion-icon :icon='languageOutline' /><span><strong>Idioma</strong></span><b>Português (BR)</b><ion-icon class='chevron' :icon='chevronForwardOutline' /></div>
          </settings-section>
          <settings-section title='CONTA'>
            <button class='setting-row' type='button' @click='passwordOpen = true'><ion-icon :icon='keyOutline' /><span><strong>Alterar senha</strong></span><ion-icon class='chevron' :icon='chevronForwardOutline' /></button>
            <button class='setting-row' type='button' @click='router.push(`/admin/empresa`)'><ion-icon :icon='businessOutline' /><span><strong>Dados da empresa</strong></span><ion-icon class='chevron' :icon='chevronForwardOutline' /></button>
            <button class='setting-row' type='button' @click='router.push(`/admin/usuarios`)'><ion-icon :icon='peopleOutline' /><span><strong>Gerenciar usuários</strong></span><ion-icon class='chevron' :icon='chevronForwardOutline' /></button>
          </settings-section>
          <settings-section title='SOBRE'>
            <div class='setting-row text-row'><span><strong>Versão do app</strong></span><b>v1.0.0</b></div>
            <button class='setting-row text-row' type='button' @click='showInfo(`Termos de uso`)'><span><strong>Termos de uso</strong></span><ion-icon class='chevron' :icon='chevronForwardOutline' /></button>
            <button class='setting-row text-row' type='button' @click='showInfo(`Política de privacidade`)'><span><strong>Política de privacidade</strong></span><ion-icon class='chevron' :icon='chevronForwardOutline' /></button>
          </settings-section>
          <button class='delete-account-button' type='button' @click='deleteConfirmOpen = true'><ion-icon :icon='trashOutline' /><span>Excluir conta</span></button>
          <button class='logout-button' type='button' @click='confirmLogout'>Sair</button>
        </template>
      </main>


      <ion-modal :is-open='deleteConfirmOpen' class='delete-modal' @did-dismiss='deleteConfirmOpen = false'>
        <ion-content class='delete-modal-content'>
          <section class='delete-card'>
            <span class='delete-icon'><ion-icon :icon='trashOutline' /></span>
            <h2>Excluir conta?</h2>
            <p>Seu acesso e perfil serão removidos do VaultPOS. Essa ação não pode ser desfeita.</p>
            <div class='delete-actions'>
              <button class='cancel-delete' type='button' :disabled='authStore.loading' @click='deleteConfirmOpen = false'>Cancelar</button>
              <button class='confirm-delete' type='button' :disabled='authStore.loading' @click='deleteAccount'>{{ authStore.loading ? 'Excluindo...' : 'Sim, excluir' }}</button>
            </div>
          </section>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open='passwordOpen' :initial-breakpoint='0.68' :breakpoints='[0, 0.68, 1]' @did-dismiss='closePasswordModal'>
        <ion-content class='password-modal'><div class='modal-handle' /><header><h2>Alterar senha</h2><button type='button' @click='closePasswordModal'><ion-icon :icon='closeOutline' /></button></header><form @submit.prevent='changePassword'>
          <label><span>Senha atual</span><input v-model='passwordForm.current' type='password' autocomplete='current-password' /></label>
          <label><span>Nova senha</span><input v-model='passwordForm.next' type='password' minlength='8' autocomplete='new-password' /></label>
          <label><span>Confirmar nova senha</span><input v-model='passwordForm.confirm' type='password' minlength='8' autocomplete='new-password' /></label>
          <p v-if='passwordError'>{{ passwordError }}</p><vault-button label='Salvar nova senha' loading-label='Salvando...' :loading='savingPassword' @click='changePassword' />
        </form></ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonModal, IonPage, IonToggle, alertController } from '@ionic/vue'
import { businessOutline, chevronForwardOutline, closeOutline, keyOutline, languageOutline, moonOutline, peopleOutline, trashOutline } from 'ionicons/icons'
import { computed, defineComponent, h, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultAvatar from '@/components/common/VaultAvatar.vue'
import VaultBadge from '@/components/common/VaultBadge.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { supabase } from '@/supabase/client'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

const SettingsSection = defineComponent({ props: { title: { type: String, required: true } }, setup(props, { slots }) { return () => h('section', { class: 'settings-section' }, [h('h2', props.title), h('div', { class: 'section-card' }, slots.default?.())]) } })
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const { showToast } = useVaultToast()
const deleteConfirmOpen = ref(false)
const passwordOpen = ref(false)
const savingPassword = ref(false)
const passwordError = ref('')
const passwordForm = reactive({ current: '', next: '', confirm: '' })
const displayName = computed(() => userStore.nomeUsuario || String(authStore.user?.user_metadata?.full_name || 'Administrador'))
async function editProfile() { const alert = await alertController.create({ header: 'Editar perfil', inputs: [{ name: 'name', type: 'text', value: displayName.value, placeholder: 'Nome' }, { name: 'phone', type: 'tel', value: userStore.usuario?.telefone || '', placeholder: 'Telefone' }], buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Salvar', handler: async (data) => { try { await userStore.updatePerfil({ nome: String(data.name || '').trim(), telefone: String(data.phone || '').trim() }); await showToast('Perfil atualizado!', 'success') } catch { await showToast(userStore.error || 'Erro ao atualizar perfil.', 'error') } } }] }); await alert.present() }
function closePasswordModal() { passwordOpen.value = false; passwordForm.current = ''; passwordForm.next = ''; passwordForm.confirm = ''; passwordError.value = '' }
function validatePassword() { if (!passwordForm.current) return 'Informe sua senha atual.'; if (passwordForm.next.length < 8) return 'A nova senha deve ter no mínimo 8 caracteres.'; if (passwordForm.next !== passwordForm.confirm) return 'As novas senhas não coincidem.'; return '' }
async function changePassword() { passwordError.value = validatePassword(); if (passwordError.value || savingPassword.value || !authStore.userEmail) return; savingPassword.value = true; try { const { error: loginError } = await supabase.auth.signInWithPassword({ email: authStore.userEmail, password: passwordForm.current }); if (loginError) throw loginError; const { error } = await supabase.auth.updateUser({ password: passwordForm.next }); if (error) throw error; closePasswordModal(); await showToast('Senha alterada com sucesso!', 'success') } catch (error) { passwordError.value = error instanceof Error ? error.message : 'Erro ao alterar senha.'; await showToast(passwordError.value, 'error') } finally { savingPassword.value = false } }
async function showInfo(title: string) { const alert = await alertController.create({ header: title, message: 'Este conteúdo será disponibilizado em breve.', buttons: ['OK'] }); await alert.present() }
async function confirmLogout() { const alert = await alertController.create({ header: 'Sair?', message: 'Deseja encerrar sua sessão?', buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Sim, sair', role: 'destructive', handler: async () => { await authStore.logout(); userStore.clear(); await router.replace('/login') } }] }); await alert.present() }
async function deleteAccount() { try { await authStore.deleteAccount(userStore.empresaId); deleteConfirmOpen.value = false; userStore.clear(); await showToast('Conta excluída com sucesso.', 'success'); await router.replace('/login') } catch { await showToast(authStore.error || 'Não foi possível excluir a conta.', 'error') } }
</script>

<style scoped>
.settings-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(92px + env(safe-area-inset-bottom))}.page-shell>h1{margin:0;font-size:24px}.profile-card{display:flex;align-items:center;margin-top:16px;border-radius:12px;padding:16px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06)}.profile-card :deep(.vault-avatar){width:56px;height:56px;font-size:22px}.profile-card>span{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.profile-card strong{font-size:16px}.profile-card small{margin-top:3px;color:#9CA3AF;font-size:12px}.profile-card button{border:0;background:transparent;color:#991B1B;font:600 13px Inter}:deep(.settings-section){display:block;margin-top:20px}:deep(.settings-section h2){margin:0 0 8px;color:#9CA3AF;font-size:11px;font-weight:600;letter-spacing:.5px}:deep(.section-card){overflow:hidden;border-radius:12px;background:#FFFFFF}.setting-row{display:flex;width:100%;min-height:60px;align-items:center;border:0;border-bottom:1px solid #F9FAFB;padding:12px 16px;background:#FFFFFF;color:#111827;text-align:left}.setting-row:last-child{border:0}.setting-row>ion-icon{flex:0 0 auto;color:#9CA3AF;font-size:20px}.setting-row>span{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.setting-row.text-row>span{margin-left:0}.setting-row strong{font-size:14px;font-weight:600}.setting-row small{margin-top:3px;color:#9CA3AF;font-size:12px}.setting-row>b{color:#9CA3AF;font-size:13px;font-weight:400}.setting-row .chevron{margin-left:8px;color:#D1D5DB;font-size:16px}.setting-row.disabled{opacity:.7}.setting-row ion-toggle{margin-left:8px}.delete-account-button,.logout-button{display:flex;align-items:center;justify-content:center;margin:28px auto 0;border:0;background:transparent;color:#EF4444;font:600 15px Inter}.delete-account-button ion-icon{margin-right:6px;font-size:18px}.logout-button{margin-top:8px;color:#6B7280}.delete-modal{--background:rgba(17,24,39,.42);--width:100%;--height:100%}.delete-modal-content{--background:transparent;--padding-start:24px;--padding-end:24px}.delete-modal-content::part(scroll){display:grid;min-height:100%;place-items:center}.delete-card{width:min(360px,100%);border-radius:20px;padding:24px;background:#FFFFFF;box-shadow:0 18px 45px rgba(17,24,39,.18);text-align:center}.delete-icon{display:grid;width:54px;height:54px;margin:0 auto 14px;place-items:center;border-radius:50%;background:#FEF2F2;color:#EF4444}.delete-icon ion-icon{font-size:24px}.delete-card h2{margin:0;color:#111827;font-size:20px}.delete-card p{margin:8px 0 0;color:#6B7280;font-size:14px;line-height:1.45}.delete-actions{display:grid;grid-template-columns:1fr;gap:10px;margin-top:22px}.delete-actions button{height:48px;border:0;border-radius:12px;font:600 14px Inter}.cancel-delete{background:#F3F4F6;color:#111827}.confirm-delete{background:#EF4444;color:#FFFFFF}.delete-actions button:disabled{opacity:.7}.password-modal{--background:#FFFFFF;--color:#111827}.modal-handle{width:32px;height:4px;margin:12px auto;border-radius:2px;background:#E5E7EB}.password-modal header{display:flex;align-items:center;justify-content:space-between;padding:0 20px}.password-modal h2{margin:0;font-size:18px}.password-modal header button{display:grid;width:28px;height:28px;place-items:center;border:0;border-radius:50%;background:#F3F4F6}.password-modal form{display:grid;gap:16px;padding:20px}.password-modal label{color:#6B7280;font-size:13px}.password-modal label span{display:block;margin-bottom:6px}.password-modal input{width:100%;height:52px;border:1px solid #E5E7EB;border-radius:10px;outline:0;padding:0 16px;background:#F8FAFC;color:#111827;font:400 14px Inter}.password-modal form>p{margin:0;color:#EF4444;font-size:12px}
</style>
