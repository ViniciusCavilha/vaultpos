<template>
  <ion-page><ion-content :fullscreen="true" class="page-content">
    <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content/></ion-refresher>
    <main class="page-shell">
      <h1>Financeiro</h1>
      <VaultErrorState v-if="financeiroStore.error" :message="financeiroStore.error" @retry="load"/>
      <template v-else>
        <div v-if="financeiroStore.loading" class="kpi-grid"><VaultSkeleton v-for="n in 4" :key="n" variant="kpi"/></div>
        <div v-else class="kpi-grid">
          <article class="success"><span>Total recebido<ion-icon :icon="trendingUpOutline"/></span><strong>{{money(financeiroStore.totalRecebido)}}</strong></article>
          <article class="info"><span>Via PIX<ion-icon :icon="qrCodeOutline"/></span><strong>{{money(financeiroStore.totalPix)}}</strong></article>
          <article><span>Via Cartão<ion-icon :icon="cardOutline"/></span><strong>{{money(financeiroStore.totalCartao)}}</strong></article>
          <article class="warning"><span>Via Dinheiro<ion-icon :icon="cashOutline"/></span><strong>{{money(financeiroStore.totalDinheiro)}}</strong></article>
        </div>
        <section>
          <div class="section-header"><h2>Pagamentos</h2><div><button v-for="p in periods" :key="p.value" :class="{active:period===p.value}" @click="period=p.value">{{p.label}}</button></div></div>
          <VaultSkeleton v-if="financeiroStore.loading" variant="list"/>
          <VaultEmptyState v-else-if="!payments.length" icon="card-outline" title="Sem pagamentos" message="Nenhum pagamento registrado neste período."/>
          <div v-else class="payments"><article v-for="payment in payments" :key="payment.id">
            <span class="method-icon" :class="payment.metodo"><ion-icon :icon="methodIcon(payment.metodo)"/></span>
            <span class="payment-info"><strong>Mesa {{payment.comandas?.mesa??'-'}} · {{methodLabel(payment.metodo)}}</strong><small>{{payment.usuarios?.nome??'Usuário'}} · {{time(payment.data_pagamento)}}</small></span>
            <b>{{money(payment.valor)}}</b>
          </article></div>
        </section>
      </template>
    </main>
  </ion-content></ion-page>
</template>

<script setup lang="ts">
import{computed,onMounted,ref}from'vue';import{IonContent,IonIcon,IonPage,IonRefresher,IonRefresherContent}from'@ionic/vue';import{cardOutline,cashOutline,qrCodeOutline,trendingUpOutline}from'ionicons/icons'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue';import VaultErrorState from '@/components/common/VaultErrorState.vue';import VaultSkeleton from '@/components/common/VaultSkeleton.vue';import{useFinanceiroStore}from'@/stores/financeiro.store';import{useUserStore}from'@/stores/user.store'
const financeiroStore=useFinanceiroStore(),userStore=useUserStore(),period=ref<'today'|'week'|'month'>('today');const periods=[{label:'Hoje',value:'today'},{label:'Semana',value:'week'},{label:'Mês',value:'month'}]as const
const payments=computed(()=>{const now=new Date();return financeiroStore.pagamentos.filter(p=>{const d=new Date(p.data_pagamento);if(period.value==='today')return d.toDateString()===now.toDateString();if(period.value==='week')return now.getTime()-d.getTime()<=7*86400000;return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()})})
function money(v:number){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v??0)}function time(v:string){return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(v))}function methodLabel(v:string){return v==='pix'?'PIX':v==='cartao'?'Cartão':'Dinheiro'}function methodIcon(v:string){return v==='pix'?qrCodeOutline:v==='cartao'?cardOutline:cashOutline}
async function load(){if(!userStore.usuario)await userStore.fetchUsuarioLogado();await financeiroStore.fetchPagamentos()}async function refresh(e:CustomEvent){await load();(e.target as HTMLIonRefresherElement).complete()}onMounted(load)
</script>

<style scoped>
.page-content{--background:#F8FAFC}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px 36px;font-family:'Inter',sans-serif}h1{margin:0;color:#111827;font-size:24px;font-weight:700;letter-spacing:0}.kpi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}.kpi-grid article,.kpi-grid>:deep(.skeleton){min-height:94px;padding:16px;border-radius:12px;background:#FFFFFF}.kpi-grid span{display:flex;align-items:center;justify-content:space-between;color:#6B7280;font-size:12px}.kpi-grid ion-icon{width:16px;height:16px}.kpi-grid strong{display:block;margin-top:8px;color:#6B7280;font-size:20px;letter-spacing:0}.kpi-grid .success strong,.kpi-grid .success ion-icon{color:#22C55E}.kpi-grid .info strong,.kpi-grid .info ion-icon{color:#0EA5E9}.kpi-grid .warning strong,.kpi-grid .warning ion-icon{color:#F59E0B}section{margin-top:24px}.section-header{display:flex;align-items:center;justify-content:space-between}.section-header h2{margin:0;color:#111827;font-size:16px}.section-header>div{display:flex;gap:4px}.section-header button{padding:6px 10px;border:0;border-radius:18px;background:#F3F4F6;color:#6B7280;font-size:11px}.section-header button.active{background:#111827;color:#FFFFFF}.payments{margin-top:12px}.payments article{display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:14px 16px;border-radius:12px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06)}.method-icon{display:grid;width:40px;height:40px;place-items:center;border-radius:50%;background:#FEF3C7;color:#F59E0B}.method-icon.pix{background:#F0FDF4;color:#22C55E}.method-icon.cartao{background:#E0F2FE;color:#0EA5E9}.payment-info{display:flex;min-width:0;flex:1;flex-direction:column;gap:3px}.payment-info strong{color:#111827;font-size:14px}.payment-info small{color:#9CA3AF;font-size:12px}.payments article>b{color:#111827;font-size:15px;white-space:nowrap}
</style>
