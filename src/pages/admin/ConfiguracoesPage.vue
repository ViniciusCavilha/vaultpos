<template>
  <ion-page><ion-content :fullscreen="true" class="page-content"><main class="page-shell">
    <h1>Configurações</h1>
    <VaultSkeleton v-if="userStore.loading&&!userStore.usuario" variant="avatar"/><VaultErrorState v-else-if="userStore.error&&!userStore.usuario" :message="userStore.error" @retry="load"/>
    <template v-else>
      <section class="profile-card"><VaultAvatar :name="userStore.nomeUsuario||'Admin'" size="md"/><span><strong>{{userStore.nomeUsuario||'Administrador'}}</strong><small>Administrador</small></span><button @click="router.push('/admin/empresa')">Editar perfil</button></section>
      <section><h2>Preferências</h2><div class="settings-card">
        <div class="setting-row"><ion-icon :icon="moonOutline"/><span><strong>Tema</strong><small>Modo escuro</small></span><VaultBadge label="Em breve"/><ion-toggle :disabled="true"/></div>
        <button class="setting-row" @click="languageOpen=true"><ion-icon :icon="languageOutline"/><span><strong>Idioma</strong><small>Português (BR)</small></span><ion-icon class="chevron" :icon="chevronForward"/></button>
      </div></section>
      <section><h2>Conta</h2><div class="settings-card">
        <button class="setting-row" @click="passwordModal=true"><ion-icon :icon="keyOutline"/><span><strong>Alterar senha</strong></span><ion-icon class="chevron" :icon="chevronForward"/></button>
        <button class="setting-row" @click="router.push('/admin/empresa')"><ion-icon :icon="businessOutline"/><span><strong>Dados da empresa</strong></span><ion-icon class="chevron" :icon="chevronForward"/></button>
        <button class="setting-row" @click="router.push('/admin/usuarios')"><ion-icon :icon="peopleOutline"/><span><strong>Gerenciar usuários</strong></span><ion-icon class="chevron" :icon="chevronForward"/></button>
      </div></section>
      <section><h2>Sobre</h2><div class="settings-card">
        <div class="setting-row"><span><strong>Versão do app</strong></span><small>v1.0.0</small></div>
        <button class="setting-row"><span><strong>Termos de uso</strong></span><ion-icon class="chevron" :icon="chevronForward"/></button>
        <button class="setting-row"><span><strong>Política de privacidade</strong></span><ion-icon class="chevron" :icon="chevronForward"/></button>
      </div></section>
      <button class="logout" @click="logoutAlert=true">Sair</button>
    </template>
  </main>
  <ion-modal :is-open="passwordModal" :initial-breakpoint=".65" :breakpoints="[0,.65]" @did-dismiss="closePassword"><ion-content class="password-sheet"><div class="handle"></div><header><h2>Alterar senha</h2><button @click="closePassword">×</button></header><form @submit.prevent="changePassword">
    <VaultInput v-model="password.current" label="Senha atual" type="password"/><VaultInput v-model="password.next" label="Nova senha" type="password" placeholder="Mínimo 8 caracteres"/><VaultInput v-model="password.confirm" label="Confirmar nova senha" type="password"/>
    <p v-if="passwordError">{{passwordError}}</p><VaultButton label="Salvar nova senha" loading-label="Salvando..." :loading="savingPassword" @click="changePassword"/>
  </form></ion-content></ion-modal>
  <ion-alert :is-open="logoutAlert" header="Sair?" message="Deseja encerrar sua sessão?" :buttons="logoutButtons" @did-dismiss="logoutAlert=false"/>
  <ion-alert :is-open="languageOpen" header="Idioma" message="O VaultPOS está configurado em Português (BR)." :buttons="['OK']" @did-dismiss="languageOpen=false"/>
  </ion-content></ion-page>
</template>

<script setup lang="ts">
import{onMounted,reactive,ref}from'vue';import{useRouter}from'vue-router';import{IonAlert,IonContent,IonIcon,IonModal,IonPage,IonToggle}from'@ionic/vue';import{businessOutline,chevronForward,keyOutline,languageOutline,moonOutline,peopleOutline}from'ionicons/icons'
import VaultAvatar from '@/components/common/VaultAvatar.vue';import VaultBadge from '@/components/common/VaultBadge.vue';import VaultButton from '@/components/common/VaultButton.vue';import VaultErrorState from '@/components/common/VaultErrorState.vue';import VaultInput from '@/components/common/VaultInput.vue';import VaultSkeleton from '@/components/common/VaultSkeleton.vue';import{useVaultToast}from'@/composables/useVaultToast';import{supabase}from'@/supabase/client';import{useAuthStore}from'@/stores/auth.store';import{useUserStore}from'@/stores/user.store'
const router=useRouter(),authStore=useAuthStore(),userStore=useUserStore(),{showToast}=useVaultToast();const passwordModal=ref(false),logoutAlert=ref(false),languageOpen=ref(false),savingPassword=ref(false),passwordError=ref('');const password=reactive({current:'',next:'',confirm:''})
const logoutButtons=[{text:'Cancelar',role:'cancel'},{text:'Sim, sair',role:'destructive',handler:()=>logout()}]
async function load(){if(!userStore.usuario)await userStore.fetchUsuarioLogado()}function closePassword(){passwordModal.value=false;passwordError.value='';Object.assign(password,{current:'',next:'',confirm:''})}
async function changePassword(){passwordError.value='';if(!password.current){passwordError.value='Informe sua senha atual.';return}if(password.next.length<8){passwordError.value='A nova senha deve ter no mínimo 8 caracteres.';return}if(password.next!==password.confirm){passwordError.value='As senhas não coincidem.';return}savingPassword.value=true;try{const{error}=await supabase.auth.updateUser({password:password.next});if(error)throw error;closePassword();await showToast('Senha alterada com sucesso!','success')}catch(e){await showToast(e instanceof Error?e.message:'Erro ao alterar senha.','error')}finally{savingPassword.value=false}}
async function logout(){await authStore.logout();userStore.clear();await router.replace('/login')}onMounted(load)
</script>

<style scoped>
.page-content{--background:#F8FAFC}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px 40px;font-family:'Inter',sans-serif}h1{margin:0;color:#111827;font-size:24px;letter-spacing:0}.profile-card{display:flex;align-items:center;gap:12px;margin-top:20px;padding:16px;border-radius:12px;background:#FFFFFF}.profile-card>span{display:flex;min-width:0;flex:1;flex-direction:column}.profile-card strong{color:#111827;font-size:15px}.profile-card small{margin-top:3px;color:#9CA3AF;font-size:12px}.profile-card button{border:0;background:transparent;color:#991B1B;font:600 13px 'Inter',sans-serif}section:not(.profile-card){margin-top:20px}section>h2{margin:0 0 8px;color:#9CA3AF;font-size:11px;font-weight:600;text-transform:uppercase}.settings-card{overflow:hidden;border-radius:12px;background:#FFFFFF}.setting-row{display:flex;width:100%;min-height:62px;align-items:center;gap:12px;padding:12px 16px;border:0;border-bottom:1px solid #F9FAFB;background:transparent;text-align:left}.setting-row:last-child{border-bottom:0}.setting-row>ion-icon{width:20px;height:20px;color:#9CA3AF}.setting-row>span{display:flex;min-width:0;flex:1;flex-direction:column;gap:3px}.setting-row strong{color:#111827;font-size:14px;font-weight:600}.setting-row small,.setting-row>small{color:#9CA3AF;font-size:12px}.setting-row .chevron{width:16px;height:16px;color:#D1D5DB}.logout{display:block;margin:32px auto 0;border:0;background:transparent;color:#EF4444;font:600 15px 'Inter',sans-serif}.password-sheet{--background:#FFFFFF}.handle{width:32px;height:4px;margin:12px auto;border-radius:2px;background:#E5E7EB}.password-sheet header{display:flex;justify-content:space-between;padding:0 20px}.password-sheet h2{margin:0;color:#111827;font-size:18px}.password-sheet header button{width:32px;height:32px;border:0;border-radius:50%;background:#F3F4F6;font-size:22px}.password-sheet form{display:grid;gap:16px;padding:20px}.password-sheet form p{margin:0;color:#EF4444;font-size:12px}
</style>
