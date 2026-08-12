<template>
  <ion-page>
    <ion-content fullscreen class='company-page'>
      <main class='page-shell'>
        <header><button type='button' aria-label='Voltar' @click='router.back()'><ion-icon :icon='chevronBackOutline' /></button><h1>Empresa</h1></header>
        <vault-skeleton v-if='loading' variant='card' />
        <vault-error-state v-else-if='errorMessage' :message='errorMessage' @retry='loadCompany' />
        <vault-empty-state v-else-if='!companyLoaded' icon='business-outline' title='Empresa não encontrada' message='Não foi possível localizar os dados da empresa.' />
        <form v-else @submit.prevent='save'>
          <button class='logo-upload' type='button' @click='fileInput?.click()'><img v-if='form.logo' :src='form.logo' alt='Logo da empresa' /><span v-else><ion-icon :icon='cameraOutline' /><b>Adicionar logo</b></span><i v-if='form.logo'>Trocar</i></button><input ref='fileInput' class='hidden-file' type='file' accept='image/*' @change='uploadLogo' />

          <company-section title='DADOS PRINCIPAIS'>
            <label class='field-row'><ion-icon :icon='businessOutline' /><span><small>Razão Social</small><input v-model='form.name' type='text' autocomplete='organization' /></span></label>
            <label class='field-row'><ion-icon :icon='businessOutline' /><span><small>Nome Fantasia</small><input v-model='form.tradeName' type='text' autocomplete='organization' /></span></label>
            <label class='field-row'><ion-icon :icon='documentOutline' /><span><small>CNPJ</small><input :value='form.cnpj' type='text' inputmode='numeric' maxlength='18' @input='maskCnpj' /></span></label>
          </company-section>

          <company-section title='CONTATO'>
            <label class='field-row'><ion-icon :icon='callOutline' /><span><small>Telefone</small><input :value='form.phone' type='tel' inputmode='tel' maxlength='15' @input='maskPhone' /></span></label>
            <label class='field-row'><ion-icon :icon='mailOutline' /><span><small>E-mail</small><input v-model='form.email' type='email' inputmode='email' autocomplete='email' /></span></label>
            <label class='field-row'><ion-icon :icon='navigateOutline' /><span><small>Endereço</small><input v-model='form.address' type='text' autocomplete='street-address' placeholder='Rua, número - Cidade, UF' /></span></label>
          </company-section>

          <company-section title='CONFIGURAÇÕES'>
            <label class='config-row'><ion-icon :icon='cashOutline' /><span>Taxa de Serviço</span><input v-model.number='form.serviceFee' type='number' min='0' max='100' inputmode='decimal' /><b>%</b></label>
            <div class='config-row'><ion-icon :icon='cashOutline' /><span>Moeda</span><ion-select v-model='form.currency' interface='popover'><ion-select-option value='BRL'>BRL — Real</ion-select-option></ion-select><ion-icon class='chevron' :icon='chevronForwardOutline' /></div>
          </company-section>

          <company-section title='PAGAMENTOS ACEITOS'>
            <div v-for='method in paymentMethods' :key='method.key' class='toggle-row'><span><strong>{{ method.title }}</strong><small>{{ method.subtitle }}</small></span><ion-toggle v-model='form[method.key]' /></div>
          </company-section>
          <footer><vault-button label='Salvar alterações' loading-label='Salvando...' :loading='saving' @click='save' /></footer>
        </form>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonPage, IonSelect, IonSelectOption, IonToggle } from '@ionic/vue'
import { businessOutline, callOutline, cameraOutline, cashOutline, chevronBackOutline, chevronForwardOutline, documentOutline, mailOutline, navigateOutline } from 'ionicons/icons'
import { defineComponent, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { getEmpresa, updateConfiguracoes, updateEmpresa } from '@/supabase/queries/empresas'
import { uploadLogoEmpresa } from '@/supabase/storage'
import { useUserStore } from '@/stores/user.store'

const CompanySection = defineComponent({ props: { title: { type: String, required: true } }, setup(props, { slots }) { return () => h('section', { class: 'company-section' }, [h('h2', props.title), h('div', { class: 'section-card' }, slots.default?.())]) } })
const router = useRouter()
const userStore = useUserStore()
const { showToast } = useVaultToast()
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const companyLoaded = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const form = reactive({ name: '', tradeName: '', cnpj: '', phone: '', email: '', address: '', logo: '', serviceFee: 10, currency: 'BRL', acceptsPix: true, acceptsCard: true, acceptsCash: true })
const paymentMethods = [{ key: 'acceptsPix' as const, title: 'PIX', subtitle: 'Pagamentos via chave PIX' }, { key: 'acceptsCard' as const, title: 'Cartão', subtitle: 'Crédito e débito' }, { key: 'acceptsCash' as const, title: 'Dinheiro', subtitle: 'Pagamento em espécie' }]
async function loadCompany() { if (!userStore.empresaId) { companyLoaded.value = false; return } loading.value = true; errorMessage.value = ''; try { const company = await getEmpresa(userStore.empresaId); form.name = company.nome || ''; form.tradeName = company.configuracoes?.nome_fantasia || ''; form.cnpj = formatCnpj(company.cnpj || ''); form.phone = formatPhone(company.telefone || ''); form.email = company.email || ''; form.address = company.endereco || ''; form.logo = company.logo || ''; form.serviceFee = Number(company.configuracoes?.taxa_servico ?? 10); form.currency = company.configuracoes?.moeda || 'BRL'; form.acceptsPix = company.configuracoes?.aceita_pix ?? true; form.acceptsCard = company.configuracoes?.aceita_cartao ?? true; form.acceptsCash = company.configuracoes?.aceita_dinheiro ?? true; companyLoaded.value = true } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Erro ao carregar empresa.' } finally { loading.value = false } }
function digits(value: string) { return value.replace(/\D/g, '') }
function formatCnpj(value: string) { return digits(value).slice(0,14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2') }
function formatPhone(value: string) { return digits(value).slice(0,11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2') }
function maskCnpj(event: Event) { form.cnpj = formatCnpj((event.target as HTMLInputElement).value) }
function maskPhone(event: Event) { form.phone = formatPhone((event.target as HTMLInputElement).value) }
async function uploadLogo(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file || !userStore.empresaId || uploading.value) return; uploading.value = true; try { form.logo = await uploadLogoEmpresa(userStore.empresaId, file); await updateEmpresa(userStore.empresaId, { logo: form.logo }); await showToast('Logo atualizado!', 'success') } catch (error) { await showToast(error instanceof Error ? error.message : 'Erro ao enviar logo.', 'error') } finally { uploading.value = false } }
async function save() { if (!userStore.empresaId || saving.value) return; saving.value = true; try { await Promise.all([updateEmpresa(userStore.empresaId, { nome: form.name.trim(), cnpj: digits(form.cnpj) || null, telefone: digits(form.phone) || null, email: form.email.trim() || null, endereco: form.address.trim() || null, logo: form.logo || null }), updateConfiguracoes(userStore.empresaId, { nome_fantasia: form.tradeName.trim() || null, taxa_servico: Number(form.serviceFee), moeda: form.currency, aceita_pix: form.acceptsPix, aceita_cartao: form.acceptsCard, aceita_dinheiro: form.acceptsCash })]); await showToast('Dados salvos com sucesso!', 'success') } catch (error) { await showToast(error instanceof Error ? error.message : 'Erro ao salvar dados.', 'error') } finally { saving.value = false } }
onMounted(loadCompany)
</script>

<style scoped>
.company-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(48px + env(safe-area-inset-top)) 20px 0}.page-shell>header{display:flex;align-items:center}.page-shell>header button{display:grid;width:36px;height:36px;place-items:center;border:0;background:transparent;color:#111827}.page-shell>header h1{margin:0 0 0 4px;font-size:22px}.logo-upload{position:relative;display:grid;width:96px;height:96px;margin:24px auto 0;place-items:center;border:0;border-radius:50%;background:#F3F4F6;color:#9CA3AF}.logo-upload img{width:96px;height:96px;border-radius:50%;object-fit:cover}.logo-upload>span{display:flex;flex-direction:column;align-items:center}.logo-upload ion-icon{font-size:32px}.logo-upload b{margin-top:8px;color:#991B1B;font-size:13px}.logo-upload>i{position:absolute;right:-8px;bottom:2px;border-radius:12px;padding:4px 8px;background:#991B1B;color:#FFFFFF;font-size:10px;font-style:normal}.hidden-file{display:none}:deep(.company-section){display:block;margin-top:24px}:deep(.company-section h2){margin:0 0 8px;color:#9CA3AF;font-size:11px;font-weight:600;letter-spacing:.5px}:deep(.section-card){overflow:hidden;border-radius:12px;background:#FFFFFF}.field-row,.config-row,.toggle-row{display:flex;min-height:68px;align-items:center;border-bottom:1px solid #F9FAFB;padding:12px 16px}.field-row:last-child,.config-row:last-child,.toggle-row:last-child{border:0}.field-row>ion-icon,.config-row>ion-icon{flex:0 0 auto;color:#9CA3AF;font-size:20px}.field-row>span{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.field-row small{color:#6B7280;font-size:13px}.field-row input{width:100%;height:30px;border:0;outline:0;padding:0;background:transparent;color:#111827;font:400 14px Inter}.config-row>span{flex:1;margin-left:12px;font-size:14px}.config-row input{width:58px;border:0;outline:0;background:transparent;color:#111827;font:600 14px Inter;text-align:right}.config-row>b{margin-left:3px}.config-row ion-select{max-width:125px;color:#111827;font-size:14px}.config-row .chevron{color:#D1D5DB;font-size:16px}.toggle-row{justify-content:space-between}.toggle-row>span{display:flex;flex-direction:column}.toggle-row strong{font-size:14px}.toggle-row small{margin-top:3px;color:#9CA3AF;font-size:12px}.toggle-row ion-toggle{--track-background-checked:#991B1B}footer{position:sticky;z-index:3;bottom:0;margin:28px -20px 0;border-top:1px solid #E5E7EB;padding:12px 20px calc(12px + env(safe-area-inset-bottom));background:#FFFFFF}
</style>
