<template>
  <ion-page>
    <ion-content fullscreen class="stock-page">
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content /></ion-refresher>
      <main class="page-shell">
        <h1>Estoque</h1>
        <div class="readonly-banner">Somente visualização</div>
        <vault-skeleton v-if="estoqueStore.loading" variant="list" />
        <vault-error-state v-else-if="estoqueStore.error" :message="estoqueStore.error" @retry="loadProducts" />
        <vault-empty-state v-else-if="!estoqueStore.produtos.length" icon="cube-outline" title="Sem produtos" message="Seu catálogo está vazio. Adicione produtos para exibi-los aqui." />
        <section v-else class="stock-list">
          <article v-for="produto in estoqueStore.produtos" :key="produto.id" class="stock-row">
            <div class="stock-line"><strong :class="stockClass(produto)">{{ produto.nome }}</strong><b :class="stockClass(produto)">{{ produto.estoque }} un</b></div>
            <div class="stock-meta"><span>{{ produto.categorias?.nome || 'Sem categoria' }}</span><span>Min: {{ produto.estoque_minimo }}</span></div>
            <div class="progress"><span :class="stockClass(produto)" :style="{ width: progressWidth(produto) }" /></div>
          </article>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import { onMounted } from 'vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useEstoqueStore } from '@/stores/estoque.store'
import type { ProdutoComCategoria } from '@/types/database.types'

const estoqueStore = useEstoqueStore()
function stockClass(produto: ProdutoComCategoria) { if (produto.estoque === 0) return 'is-empty'; if (produto.estoque <= produto.estoque_minimo) return 'is-low'; return 'is-ok' }
function progressWidth(produto: ProdutoComCategoria) { const max = Math.max(Number(produto.estoque_minimo) * 3, 1); return `${Math.min(100, (Number(produto.estoque) / max) * 100)}%` }
async function loadProducts() { await estoqueStore.fetchProdutos() }
async function refresh(event: CustomEvent) { await loadProducts(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadProducts)
</script>

<style scoped>
.stock-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(104px + env(safe-area-inset-bottom))}h1{margin:0;color:#111827;font-size:24px;font-weight:700}.readonly-banner{margin:16px 0;border-radius:8px;padding:10px 16px;background:#FEF2F2;color:#991B1B;font-size:13px;font-weight:600;text-align:center}.stock-list{overflow:hidden;border-radius:12px;padding:0 16px;background:#FFFFFF}.stock-row{border-bottom:1px solid #F3F4F6;padding:16px 0}.stock-row:last-child{border-bottom:0}.stock-line,.stock-meta{display:flex;align-items:center;justify-content:space-between}.stock-line strong,.stock-line b{color:#111827;font-size:14px}.stock-line strong{font-weight:600}.stock-line b{font-weight:700}.stock-meta{margin-top:3px;color:#9CA3AF;font-size:12px}.stock-meta span:last-child{font-size:11px}.progress{width:100%;height:4px;margin-top:6px;overflow:hidden;border-radius:2px;background:#F3F4F6}.progress span{display:block;height:4px;border-radius:2px}.is-ok{color:#111827}.progress .is-ok{background:#22C55E}.is-low{color:#F59E0B!important}.progress .is-low{background:#F59E0B}.is-empty{color:#EF4444!important}.progress .is-empty{min-width:0;background:#EF4444}
</style>
