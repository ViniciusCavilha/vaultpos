<template>
  <ion-page>
    <ion-content fullscreen class='settings-page'>
      <main class='page-shell'>
        <h1>Configurações</h1>
        <vault-skeleton v-if='userStore.loading' variant='avatar' />
        <vault-error-state v-else-if='userStore.error && !displayName' :message='userStore.error' @retry='userStore.fetchUsuarioLogado' />
        <template v-else>
          <input ref='photoInput' class='photo-input' type='file' accept='image/jpeg,image/png,image/webp' @change='handlePhotoSelected' />
          <article class='profile-card'><button class='avatar-button' type='button' :disabled='uploadingPhoto' aria-label='Alterar foto de perfil' @click='choosePhoto'><vault-avatar :name='displayName' :photo='profilePhoto' size='lg' /><i><ion-icon :icon='cameraOutline' /></i></button><span class='profile-copy'><strong>{{ displayName }}</strong><small>{{ uploadingPhoto ? 'Enviando foto...' : 'Administrador' }}</small></span><button class='edit-profile-button' type='button' @click='editProfile'>Editar perfil</button></article>
          <settings-section title='PREFERÊNCIAS'>
            <div class='setting-row'><ion-icon :icon='moonOutline' /><span><strong>Tema</strong><small>{{ isDarkTheme ? 'Modo escuro' : 'Modo claro' }}</small></span><ion-toggle :checked='isDarkTheme' aria-label='Alternar tema escuro' @ion-change='toggleTheme' /></div>
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
    <vault-photo-cropper :file='selectedPhotoFile' @cancel='selectedPhotoFile = null' @confirm='saveCroppedPhoto' />
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonModal, IonPage, IonToggle, alertController, type ToggleCustomEvent } from '@ionic/vue'
import { businessOutline, cameraOutline, chevronForwardOutline, closeOutline, keyOutline, languageOutline, moonOutline, peopleOutline, trashOutline } from 'ionicons/icons'
import { computed, defineComponent, h, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultAvatar from '@/components/common/VaultAvatar.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultPhotoCropper from '@/components/common/VaultPhotoCropper.vue'
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
const photoInput = ref<HTMLInputElement | null>(null)
const uploadingPhoto = ref(false)
const selectedPhotoFile = ref<File | null>(null)
const passwordError = ref('')
const isDarkTheme = ref(document.documentElement.classList.contains('vault-dark'))
function toggleTheme(event: ToggleCustomEvent) {
  const enabled = event.detail.checked
  isDarkTheme.value = enabled
  document.documentElement.classList.toggle('vault-dark', enabled)
  document.documentElement.style.colorScheme = enabled ? 'dark' : 'light'
  localStorage.setItem('vaultpos_theme', enabled ? 'dark' : 'light')
}
const passwordForm = reactive({ current: '', next: '', confirm: '' })
const displayName = computed(() => userStore.nomeUsuario || String(authStore.user?.user_metadata?.full_name || 'Administrador'))
const profilePhoto = computed(() => userStore.usuario?.foto || authStore.user?.photoURL || null)
function choosePhoto() { photoInput.value?.click() }
async function handlePhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || uploadingPhoto.value) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { await showToast('Escolha uma imagem JPG, PNG ou WebP.', 'warning'); return }
  if (file.size > 5 * 1024 * 1024) { await showToast('A imagem deve ter no máximo 5 MB.', 'warning'); return }
  if (!userStore.usuario) { await showToast('Não foi possível identificar o perfil.', 'error'); return }
  selectedPhotoFile.value = file
}
async function saveCroppedPhoto(photo: string) {
  if (uploadingPhoto.value || !userStore.usuario) return
  selectedPhotoFile.value = null
  uploadingPhoto.value = true
  try {
    await userStore.updatePerfil({ foto: photo })
    await showToast('Foto atualizada com sucesso!', 'success')
  } catch (error) {
    await showToast(userStore.error || (error instanceof Error ? error.message : 'Não foi possível atualizar a foto.'), 'error')
  } finally {
    uploadingPhoto.value = false
  }
}
async function editProfile() { const alert = await alertController.create({ header: 'Editar perfil', inputs: [{ name: 'name', type: 'text', value: displayName.value, placeholder: 'Nome' }, { name: 'phone', type: 'tel', value: userStore.usuario?.telefone || '', placeholder: 'Telefone' }], buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Salvar', handler: async (data) => { try { await userStore.updatePerfil({ nome: String(data.name || '').trim(), telefone: String(data.phone || '').trim() }); await showToast('Perfil atualizado!', 'success') } catch { await showToast(userStore.error || 'Erro ao atualizar perfil.', 'error') } } }] }); await alert.present() }
function closePasswordModal() { passwordOpen.value = false; passwordForm.current = ''; passwordForm.next = ''; passwordForm.confirm = ''; passwordError.value = '' }
function validatePassword() { if (!passwordForm.current) return 'Informe sua senha atual.'; if (passwordForm.next.length < 8) return 'A nova senha deve ter no mínimo 8 caracteres.'; if (passwordForm.next !== passwordForm.confirm) return 'As novas senhas não coincidem.'; return '' }
async function changePassword() { passwordError.value = validatePassword(); if (passwordError.value || savingPassword.value || !authStore.userEmail) return; savingPassword.value = true; try { const { error: loginError } = await supabase.auth.signInWithPassword({ email: authStore.userEmail, password: passwordForm.current }); if (loginError) throw loginError; const { error } = await supabase.auth.updateUser({ password: passwordForm.next }); if (error) throw error; closePasswordModal(); await showToast('Senha alterada com sucesso!', 'success') } catch (error) { passwordError.value = error instanceof Error ? error.message : 'Erro ao alterar senha.'; await showToast(passwordError.value, 'error') } finally { savingPassword.value = false } }
async function showInfo(title: string) { const alert = await alertController.create({ header: title, message: 'Este conteúdo será disponibilizado em breve.', buttons: ['OK'] }); await alert.present() }
async function deleteAccount() { try { await authStore.deleteAccount(userStore.empresaId); deleteConfirmOpen.value = false; userStore.clear(); await showToast('Conta excluída com sucesso.', 'success'); window.location.replace('/login') } catch { if (authStore.deleteRequiresLogin) { deleteConfirmOpen.value = false; await authStore.logout(); userStore.clear(); window.location.replace('/login?deleteAccount=1'); return } await showToast(authStore.error || 'Não foi possível excluir a conta.', 'error') } }
</script>

<style scoped>
.settings-page{--background:var(--vault-color-bg);--color:var(--vault-color-text-1)}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(92px + env(safe-area-inset-bottom))}.page-shell>h1{margin:0;font-size:24px}.profile-card{display:flex;align-items:center;margin-top:16px;border-radius:12px;padding:16px;background:var(--vault-color-surface);box-shadow:0 1px 3px rgba(0,0,0,.06)}.photo-input{display:none}.avatar-button{position:relative;width:56px;height:56px;min-width:56px;flex:0 0 56px;border:0;border-radius:50%;padding:0;background:transparent}.avatar-button:disabled{opacity:.65}.avatar-button :deep(.vault-avatar){width:56px;height:56px;min-width:56px;aspect-ratio:1;border-radius:50%;font-size:22px}.avatar-button>i{position:absolute;right:-2px;bottom:-2px;display:grid;width:20px;height:20px;place-items:center;border:2px solid var(--vault-color-surface);border-radius:50%;background:#991B1B;color:#FFFFFF;font-style:normal}.avatar-button>i ion-icon{font-size:11px}.profile-card>.profile-copy{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.profile-card strong{font-size:16px}.profile-card small{margin-top:3px;color:var(--vault-color-text-3);font-size:12px}.edit-profile-button{border:0;background:transparent;color:#991B1B;font:600 13px Inter}:deep(.settings-section){display:block;margin-top:20px}:deep(.settings-section h2){margin:0 0 8px;color:var(--vault-color-text-3);font-size:11px;font-weight:600;letter-spacing:.5px}:deep(.section-card){overflow:hidden;border-radius:12px;background:var(--vault-color-surface)}.setting-row{display:flex;width:100%;min-height:60px;align-items:center;border:0;border-bottom:1px solid var(--vault-color-surface-subtle);padding:12px 16px;background:var(--vault-color-surface);color:var(--vault-color-text-1);text-align:left}.setting-row:last-child{border:0}.setting-row>ion-icon{flex:0 0 auto;color:var(--vault-color-text-3);font-size:20px}.setting-row>span{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.setting-row.text-row>span{margin-left:0}.setting-row strong{font-size:14px;font-weight:600}.setting-row small{margin-top:3px;color:var(--vault-color-text-3);font-size:12px}.setting-row>b{color:var(--vault-color-text-3);font-size:13px;font-weight:400}.setting-row .chevron{margin-left:8px;color:var(--vault-color-placeholder);font-size:16px}.setting-row.disabled{opacity:.7}.setting-row ion-toggle{margin-left:8px}.delete-account-button{display:flex;align-items:center;justify-content:center;margin:28px auto 0;border:0;background:transparent;color:#EF4444;font:600 15px Inter}.delete-account-button ion-icon{margin-right:6px;font-size:18px}.delete-modal{--background:rgba(17,24,39,.42);--width:100%;--height:100%}.delete-modal-content{--background:transparent;--padding-start:24px;--padding-end:24px}.delete-modal-content::part(scroll){display:grid;min-height:100%;place-items:center}.delete-card{width:min(360px,100%);border-radius:20px;padding:24px;background:var(--vault-color-surface);box-shadow:0 18px 45px rgba(17,24,39,.18);text-align:center}.delete-icon{display:grid;width:54px;height:54px;margin:0 auto 14px;place-items:center;border-radius:50%;background:var(--vault-color-primary-soft);color:#EF4444}.delete-icon ion-icon{font-size:24px}.delete-card h2{margin:0;color:var(--vault-color-text-1);font-size:20px}.delete-card p{margin:8px 0 0;color:var(--vault-color-text-2);font-size:14px;line-height:1.45}.delete-actions{display:grid;grid-template-columns:1fr;gap:10px;margin-top:22px}.delete-actions button{height:48px;border:0;border-radius:12px;font:600 14px Inter}.cancel-delete{background:var(--vault-color-surface-muted);color:var(--vault-color-text-1)}.confirm-delete{background:#EF4444;color:#FFFFFF}.delete-actions button:disabled{opacity:.7}.password-modal{--background:var(--vault-color-surface);--color:var(--vault-color-text-1)}.modal-handle{width:32px;height:4px;margin:12px auto;border-radius:2px;background:var(--vault-color-border)}.password-modal header{display:flex;align-items:center;justify-content:space-between;padding:0 20px}.password-modal h2{margin:0;font-size:18px}.password-modal header button{display:grid;width:28px;height:28px;place-items:center;border:0;border-radius:50%;background:var(--vault-color-surface-muted)}.password-modal form{display:grid;gap:16px;padding:20px}.password-modal label{color:var(--vault-color-text-2);font-size:13px}.password-modal label span{display:block;margin-bottom:6px}.password-modal input{width:100%;height:52px;border:1px solid var(--vault-color-border);border-radius:10px;outline:0;padding:0 16px;background:var(--vault-color-bg);color:var(--vault-color-text-1);font:400 14px Inter}.password-modal form>p{margin:0;color:#EF4444;font-size:12px}
</style>
