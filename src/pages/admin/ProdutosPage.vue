<template>
  <ion-page>
    <ion-content :fullscreen="true" class="page-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content /></ion-refresher>
      <main class="page-shell">
        <header class="page-header"><h1>Produtos</h1><button type="button" @click="openCreate"><ion-icon :icon="add" /></button></header>
        <div class="search"><ion-icon :icon="searchOutline" /><input v-model="search" type="search" placeholder="Buscar produto..." /></div>
        <div class="chips">
          <button :class="{active: !category}" @click="category = ''">Todos</button>
          <button v-for="item in estoqueStore.categorias" :key="item.id" :class="{active: category === item.id}" @click="category = item.id">{{ item.nome }}</button>
        </div>

        <VaultSkeleton v-if="estoqueStore.loading" variant="list" />
        <VaultErrorState v-else-if="estoqueStore.error" :message="estoqueStore.error" @retry="load" />
        <VaultEmptyState v-else-if="!filteredProducts.length" icon="bag-outline" title="Sem produtos" message="Seu catálogo está vazio. Adicione produtos para exibi-los aqui." button-text="Adicionar Produto" @action="openCreate" />
        <section v-else class="product-list">
          <button v-for="product in filteredProducts" :key="product.id" type="button" class="product-row" @click="openEdit(product)">
            <span class="image"><img v-if="product.imagem" :src="product.imagem" :alt="product.nome" /><ion-icon v-else :icon="bagOutline" /></span>
            <span class="info"><strong>{{ product.nome }}</strong><small>{{ product.categorias?.nome ?? 'Sem categoria' }}</small></span>
            <span class="values"><strong>{{ money(product.preco) }}</strong><small :class="stockClass(product)">{{ product.estoque }} {{ product.unidade }}</small></span>
            <ion-icon class="chevron" :icon="chevronForward" />
          </button>
        </section>
      </main>

      <ion-modal :is-open="modalOpen" @did-dismiss="closeModal">
        <ion-page>
          <ion-content class="modal-content">
            <header class="modal-header"><h2>{{ selected ? 'Editar Produto' : 'Novo Produto' }}</h2><button @click="closeModal">×</button></header>
            <form class="product-form" @submit.prevent="save">
              <VaultInput v-model="form.nome" label="Nome" placeholder="Nome do produto" />
              <label>Categoria<ion-select v-model="form.categoria_id" interface="action-sheet" placeholder="Selecione"><ion-select-option v-for="item in estoqueStore.categorias" :key="item.id" :value="item.id">{{ item.nome }}</ion-select-option></ion-select></label>
              <div class="form-grid"><VaultInput v-model="form.preco" label="Preço (R$)" type="number" /><VaultInput v-model="form.custo" label="Custo (R$)" type="number" /></div>
              <div class="form-grid"><VaultInput v-model="form.estoque" label="Estoque atual" type="number" /><VaultInput v-model="form.estoque_minimo" label="Estoque mínimo" type="number" /></div>
              <label>Unidade<ion-select v-model="form.unidade" interface="action-sheet"><ion-select-option v-for="unit in ['un','kg','L','ml']" :key="unit" :value="unit">{{ unit }}</ion-select-option></ion-select></label>
              <VaultInput v-model="form.codigo" label="Código" placeholder="Opcional" />
              <label>Descrição<textarea v-model="form.descricao" placeholder="Descrição do produto"></textarea></label>
              <VaultButton label="Salvar produto" loading-label="Salvando..." :loading="saving" @click="save" />
              <VaultButton v-if="selected" variant="outline" label="Excluir produto" @click="deleteAlertOpen = true" />
            </form>
          </ion-content>
        </ion-page>
      </ion-modal>
      <ion-alert :is-open="deleteAlertOpen" header="Excluir produto?" message="O produto será desativado do catálogo." :buttons="deleteButtons" @did-dismiss="deleteAlertOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonAlert, IonContent, IonIcon, IonModal, IonPage, IonRefresher, IonRefresherContent, IonSelect, IonSelectOption } from '@ionic/vue'
import { add, bagOutline, chevronForward, searchOutline } from 'ionicons/icons'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultInput from '@/components/common/VaultInput.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { createProduto, deleteProduto, updateProduto } from '@/firebase/collections/produtos'
import { useEstoqueStore } from '@/stores/estoque.store'
import { useUserStore } from '@/stores/user.store'

const estoqueStore = useEstoqueStore()
const userStore = useUserStore()
const { showToast } = useVaultToast()
const search = ref('')
const category = ref('')
const modalOpen = ref(false)
const deleteAlertOpen = ref(false)
const selected = ref<any | null>(null)
const saving = ref(false)
const form = reactive({ nome:'', categoria_id:'', preco:'', custo:'', estoque:'', estoque_minimo:'', unidade:'un', codigo:'', descricao:'' })
const filteredProducts = computed(() => estoqueStore.produtosAtivos.filter((p) => p.nome.toLowerCase().includes(search.value.toLowerCase()) && (!category.value || p.categoria_id === category.value)))
const deleteButtons = [{text:'Cancelar',role:'cancel'},{text:'Excluir',role:'destructive',handler:()=>remove()}]
function money(v:number){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v??0)}
function stockClass(p:any){return p.estoque<=0?'empty':p.estoque<=p.estoque_minimo?'low':'ok'}
function reset(){Object.assign(form,{nome:'',categoria_id:'',preco:'',custo:'',estoque:'',estoque_minimo:'',unidade:'un',codigo:'',descricao:''})}
function openCreate(){selected.value=null;reset();modalOpen.value=true}
function openEdit(p:any){selected.value=p;Object.assign(form,{nome:p.nome,categoria_id:p.categoria_id??'',preco:String(p.preco),custo:String(p.custo),estoque:String(p.estoque),estoque_minimo:String(p.estoque_minimo),unidade:p.unidade,codigo:p.codigo??'',descricao:p.descricao??''});modalOpen.value=true}
function closeModal(){modalOpen.value=false;selected.value=null;reset()}
async function load(){if(!userStore.usuario)await userStore.fetchUsuarioLogado();await Promise.all([estoqueStore.fetchProdutos(),estoqueStore.fetchCategorias()])}
async function refresh(e:CustomEvent){await load();(e.target as HTMLIonRefresherElement).complete()}
async function save(){
 if(!form.nome.trim()||!userStore.empresaId||saving.value)return
 saving.value=true
 const payload={nome:form.nome.trim(),categoria_id:form.categoria_id||null,preco:Number(form.preco)||0,custo:Number(form.custo)||0,estoque:Number(form.estoque)||0,estoque_minimo:Number(form.estoque_minimo)||0,unidade:form.unidade,codigo:form.codigo||null,descricao:form.descricao||null,ativo:true}
 try{if(selected.value)await updateProduto(userStore.empresaId,selected.value.id,payload);else await createProduto(userStore.empresaId,{...payload,imagem:null});await estoqueStore.fetchProdutos();closeModal();await showToast('Produto salvo com sucesso!','success')}catch(e){await showToast(e instanceof Error?e.message:'Erro ao salvar produto.','error')}finally{saving.value=false}
}
async function remove(){if(!selected.value||!userStore.empresaId)return;try{await deleteProduto(userStore.empresaId,selected.value.id);await estoqueStore.fetchProdutos();closeModal();await showToast('Produto excluído.','success')}catch(e){await showToast(e instanceof Error?e.message:'Erro ao excluir produto.','error')}}
onMounted(load)
</script>

<style scoped>
.page-content{--background:#F8FAFC}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px 36px;font-family:'Inter',sans-serif}.page-header{display:flex;align-items:center;justify-content:space-between}.page-header h1{margin:0;color:#111827;font-size:24px;font-weight:700;letter-spacing:0}.page-header button{display:grid;width:40px;height:40px;padding:0;place-items:center;border:0;border-radius:50%;background:#991B1B;color:#FFFFFF}.search{position:relative;margin-top:16px}.search ion-icon{position:absolute;top:50%;left:14px;width:18px;height:18px;transform:translateY(-50%);color:#9CA3AF}.search input{width:100%;height:46px;padding:0 16px 0 42px;border:0;border-radius:10px;outline:0;background:#F3F4F6;color:#111827;font:400 14px 'Inter',sans-serif}.chips{display:flex;gap:8px;margin:12px -20px 16px;padding:0 20px;overflow-x:auto}.chips button{flex:0 0 auto;padding:8px 16px;border:0;border-radius:20px;background:#F3F4F6;color:#6B7280;font:400 13px 'Inter',sans-serif}.chips button.active{background:#111827;color:#FFFFFF;font-weight:600}.product-list{overflow:hidden;border-radius:12px;background:#FFFFFF}.product-row{display:flex;width:100%;align-items:center;gap:12px;padding:14px 12px;border:0;border-bottom:1px solid #F3F4F6;background:transparent;text-align:left}.image{display:grid;width:48px;height:48px;overflow:hidden;place-items:center;border-radius:8px;background:#F9FAFB;color:#9CA3AF}.image img{width:100%;height:100%;object-fit:cover}.info{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}.info strong{overflow:hidden;color:#111827;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.info small,.values small{color:#9CA3AF;font-size:12px}.values{display:flex;align-items:flex-end;flex-direction:column;gap:4px}.values strong{color:#111827;font-size:14px}.values small.low{color:#F59E0B}.values small.empty{color:#EF4444}.chevron{width:16px;color:#D1D5DB}.modal-content{--background:#F8FAFC}.modal-header{display:flex;align-items:center;justify-content:space-between;padding:calc(24px + env(safe-area-inset-top)) 20px 12px;background:#FFFFFF}.modal-header h2{margin:0;color:#111827;font-size:20px}.modal-header button{width:34px;height:34px;border:0;border-radius:50%;background:#F3F4F6;color:#6B7280;font-size:22px}.product-form{display:grid;gap:16px;padding:20px 20px 40px}.product-form>label{color:#6B7280;font-size:13px}.product-form ion-select,.product-form textarea{display:block;width:100%;margin-top:6px;border:1px solid #E5E7EB;border-radius:10px;background:#FFFFFF;color:#111827}.product-form ion-select{height:52px;padding:0 12px}.product-form textarea{height:88px;padding:12px 16px;resize:none;outline:0;font:400 14px 'Inter',sans-serif}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
</style>
