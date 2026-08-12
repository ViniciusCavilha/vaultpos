<template>
  <ion-page>
    <ion-content :fullscreen="true" class="page-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content />
      </ion-refresher>
      <main class="page-shell">
        <h1>Estoque</h1>
        <div class="readonly-banner">Somente visualização</div>

        <VaultSkeleton v-if="estoqueStore.loading" variant="list" />
        <VaultErrorState v-else-if="estoqueStore.error" :message="estoqueStore.error" @retry="load" />
        <VaultEmptyState
          v-else-if="!estoqueStore.produtosAtivos.length"
          icon="cube-outline"
          title="Sem produtos"
          message="Nenhum produto disponível no estoque."
        />
        <section v-else class="stock-list">
          <article
            v-for="product in estoqueStore.produtosAtivos"
            :key="product.id"
            class="stock-row"
            :class="stockState(product)"
          >
            <div class="stock-line">
              <strong>{{ product.nome }}</strong>
              <b>{{ product.estoque }} {{ product.unidade }}</b>
            </div>
            <div class="stock-meta">
              <span>{{ product.categorias?.nome ?? 'Sem categoria' }}</span>
              <span>Min: {{ product.estoque_minimo }}</span>
            </div>
            <div class="progress"><span :style="{ width: progressWidth(product) }"></span></div>
          </article>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useEstoqueStore } from '@/stores/estoque.store'
import { useUserStore } from '@/stores/user.store'

const estoqueStore = useEstoqueStore()
const userStore = useUserStore()

function stockState(product: any) {
  if (product.estoque <= 0) return 'empty'
  if (product.estoque <= product.estoque_minimo) return 'low'
  return 'ok'
}
function progressWidth(product: any) {
  const base = Math.max(1, product.estoque_minimo * 3)
  return Math.min(100, (product.estoque / base) * 100) + '%'
}
async function load() {
  if (!userStore.usuario) await userStore.fetchUsuarioLogado()
  await estoqueStore.fetchProdutos()
}
async function refresh(event: CustomEvent) {
  await load()
  ;(event.target as HTMLIonRefresherElement).complete()
}
onMounted(load)
</script>

<style scoped>
.page-content { --background: #F8FAFC; }
.page-shell { min-height: 100%; padding: calc(56px + env(safe-area-inset-top)) 20px 32px; font-family: 'Inter', sans-serif; }
h1 { margin: 0; color: #111827; font-size: 24px; font-weight: 700; letter-spacing: 0; }
.readonly-banner { margin: 16px 0; padding: 10px 16px; border-radius: 8px; background: #FEF2F2; color: #991B1B; font-size: 13px; font-weight: 600; text-align: center; }
.stock-list { border-radius: 12px; background: #FFFFFF; }
.stock-row { padding: 16px; border-bottom: 1px solid #F3F4F6; }
.stock-row:last-child { border-bottom: 0; }
.stock-line, .stock-meta { display: flex; justify-content: space-between; gap: 12px; }
.stock-line strong, .stock-line b { color: #111827; font-size: 14px; font-weight: 600; }
.stock-meta { margin-top: 4px; color: #9CA3AF; font-size: 11px; }
.progress { height: 4px; margin-top: 8px; overflow: hidden; border-radius: 2px; background: #F3F4F6; }
.progress span { display: block; height: 100%; border-radius: inherit; background: #22C55E; }
.stock-row.low .stock-line strong, .stock-row.low .stock-line b { color: #F59E0B; }
.stock-row.low .progress span { background: #F59E0B; }
.stock-row.empty .stock-line strong, .stock-row.empty .stock-line b { color: #EF4444; }
.stock-row.empty .progress span { width: 0 !important; background: #EF4444; }
</style>
