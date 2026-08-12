<template>
  <ion-modal :is-open='isOpen' @did-dismiss='emit(`close`)'>
    <ion-page>
      <ion-content fullscreen class='product-modal'>
        <header><h1>{{ isEditing ? 'Editar Produto' : 'Novo Produto' }}</h1><button type='button' aria-label='Fechar' :disabled='saving' @click='emit(`close`)'><ion-icon :icon='closeOutline' /></button></header>
        <form @submit.prevent='submit'>
          <label><span>Nome *</span><input v-model='form.nome' type='text' autocomplete='off' placeholder='Nome do produto' /></label>
          <label><span>Categoria</span><ion-select v-model='form.categoria_id' interface='popover' placeholder='Selecione'><ion-select-option :value='null'>Sem categoria</ion-select-option><ion-select-option v-for='categoria in categorias' :key='categoria.id' :value='categoria.id'>{{ categoria.nome }}</ion-select-option></ion-select></label>
          <div class='form-grid'>
            <label><span>Preço *</span><div class='prefix-input'><b>R$</b><input v-model='form.preco' type='number' min='0' step='0.01' inputmode='decimal' /></div></label>
            <label><span>Custo</span><div class='prefix-input'><b>R$</b><input v-model='form.custo' type='number' min='0' step='0.01' inputmode='decimal' /></div></label>
            <label><span>Estoque atual</span><input v-model='form.estoque' type='number' min='0' step='1' inputmode='numeric' /></label>
            <label><span>Estoque mínimo</span><input v-model='form.estoque_minimo' type='number' min='0' step='1' inputmode='numeric' /></label>
          </div>
          <label><span>Unidade</span><ion-select v-model='form.unidade' interface='popover'><ion-select-option value='un'>un</ion-select-option><ion-select-option value='kg'>kg</ion-select-option><ion-select-option value='L'>L</ion-select-option><ion-select-option value='ml'>ml</ion-select-option></ion-select></label>
          <label><span>Código</span><input v-model='form.codigo' type='text' autocomplete='off' placeholder='Opcional' /></label>
          <label><span>Descrição</span><textarea v-model='form.descricao' placeholder='Descrição do produto' /></label>
          <p v-if='validationError' class='form-error'>{{ validationError }}</p>
          <vault-button label='Salvar produto' loading-label='Salvando...' :loading='saving' @click='submit' />
          <vault-button v-if='isEditing' class='delete-button' variant='outline' label='Excluir' :disabled='saving' @click='confirmDelete' />
        </form>
      </ion-content>
    </ion-page>
  </ion-modal>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonModal, IonPage, IonSelect, IonSelectOption, alertController } from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import { computed, reactive, ref, watch } from 'vue'
import VaultButton from '@/components/common/VaultButton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { useEstoqueStore } from '@/stores/estoque.store'
import type { Categoria, CreateProduto, ProdutoComCategoria, UpdateProduto } from '@/types/database.types'

const props = defineProps<{ isOpen: boolean; produto: ProdutoComCategoria | null; categorias: Categoria[] }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const estoqueStore = useEstoqueStore()
const { showToast } = useVaultToast()
const saving = ref(false)
const validationError = ref('')
const form = reactive({ nome: '', categoria_id: null as string | null, preco: '0', custo: '0', estoque: '0', estoque_minimo: '0', unidade: 'un', codigo: '', descricao: '' })
const isEditing = computed(() => Boolean(props.produto?.id))
watch(() => [props.isOpen, props.produto] as const, ([open]) => { if (open) reset() }, { immediate: true })
function reset() { const item = props.produto; form.nome = item?.nome || ''; form.categoria_id = item?.categoria_id || null; form.preco = String(item?.preco ?? 0); form.custo = String(item?.custo ?? 0); form.estoque = String(item?.estoque ?? 0); form.estoque_minimo = String(item?.estoque_minimo ?? 0); form.unidade = item?.unidade || 'un'; form.codigo = item?.codigo || ''; form.descricao = item?.descricao || ''; validationError.value = '' }
function payload(): Omit<CreateProduto, 'empresa_id'> | UpdateProduto { return { nome: form.nome.trim(), categoria_id: form.categoria_id, preco: Number(form.preco), custo: Number(form.custo), estoque: Number(form.estoque), estoque_minimo: Number(form.estoque_minimo), unidade: form.unidade, codigo: form.codigo.trim() || null, descricao: form.descricao.trim() || null, imagem: props.produto?.imagem || null, ativo: true } }
function validate() { if (!form.nome.trim()) return 'Informe o nome do produto.'; if (Number(form.preco) < 0 || Number(form.custo) < 0 || Number(form.estoque) < 0 || Number(form.estoque_minimo) < 0) return 'Os valores não podem ser negativos.'; return '' }
async function submit() {
  validationError.value = validate(); if (validationError.value || saving.value) return
  saving.value = true
  try { if (props.produto) await estoqueStore.editarProduto(props.produto.id, payload() as UpdateProduto); else await estoqueStore.criarProduto(payload() as Omit<CreateProduto, 'empresa_id'>); await showToast(props.produto ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!', 'success'); emit('saved'); emit('close') }
  catch (error) { await showToast(estoqueStore.error || (error instanceof Error ? error.message : 'Erro ao salvar produto.'), 'error') }
  finally { saving.value = false }
}
async function remove() { if (!props.produto) return; saving.value = true; try { await estoqueStore.desativarProduto(props.produto.id); await showToast('Produto excluído com sucesso!', 'success'); emit('saved'); emit('close') } catch (error) { await showToast(estoqueStore.error || (error instanceof Error ? error.message : 'Erro ao excluir produto.'), 'error') } finally { saving.value = false } }
async function confirmDelete() { const alert = await alertController.create({ header: 'Excluir produto?', message: `O produto ${form.nome} será removido das listagens.`, buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Excluir', role: 'destructive', handler: remove }] }); await alert.present() }
</script>

<style scoped>
.product-modal{--background:#F8FAFC;--color:#111827}.product-modal header{display:flex;align-items:center;justify-content:space-between;padding:calc(24px + env(safe-area-inset-top)) 20px 16px}.product-modal header h1{margin:0;font-size:20px;font-weight:700}.product-modal header button{display:grid;width:32px;height:32px;place-items:center;border:0;border-radius:50%;background:#F3F4F6;color:#6B7280}.product-modal form{display:grid;gap:16px;padding:0 20px 32px}.product-modal label{display:block;color:#6B7280;font-size:13px}.product-modal label>span{display:block;margin-bottom:6px}.product-modal input,.product-modal textarea,.product-modal ion-select,.prefix-input{width:100%;border:1px solid #E5E7EB;border-radius:10px;outline:0;background:#FFFFFF;color:#111827;font:400 14px Inter}.product-modal input,.product-modal ion-select{height:52px;padding:0 16px}.product-modal ion-select{--padding-start:16px;--padding-end:12px}.product-modal textarea{height:88px;resize:none;padding:12px 16px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.prefix-input{display:flex;align-items:center}.prefix-input b{padding-left:14px;color:#6B7280;font-size:13px}.prefix-input input{min-width:0;border:0;background:transparent}.form-error{margin:0;color:#EF4444;font-size:12px}.delete-button{margin-top:-4px}.delete-button :deep(.vault-button){--border-color:#EF4444;--color:#EF4444}@media(max-width:380px){.form-grid{grid-template-columns:1fr}}
</style>
