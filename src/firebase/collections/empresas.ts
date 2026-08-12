import { doc, getDoc, serverTimestamp, setDoc, updateDoc, type DocumentData } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { cleanData, toIsoString } from '@/firebase/firestore-utils'
import type { Configuracao, EmpresaComConfiguracoes, PlanTipo, UpdateConfiguracao, UpdateEmpresa } from '@/types/database.types'

function mapConfiguracao(empresaId: string, data: DocumentData | undefined): Configuracao | null {
  if (!data) return null
  return {
    id: 'config',
    empresa_id: empresaId,
    nome_fantasia: data.nomeFantasia ?? null,
    moeda: data.moeda ?? 'BRL',
    taxa_servico: Number(data.taxaServico ?? 0),
    tema: data.tema ?? 'light',
    impressora_padrao: data.impressoraPadrao ?? null,
    aceita_pix: data.aceitaPix ?? true,
    aceita_cartao: data.aceitaCartao ?? true,
    aceita_dinheiro: data.aceitaDinheiro ?? true,
    horario_funcionamento: data.horarioFuncionamento ?? null,
    criado_em: toIsoString(data.criadoEm),
  }
}

function mapEmpresa(id: string, data: DocumentData, configuracoes: Configuracao | null): EmpresaComConfiguracoes {
  return {
    id,
    nome: data.nome ?? '',
    cnpj: data.cnpj ?? null,
    telefone: data.telefone ?? null,
    email: data.email ?? null,
    endereco: data.endereco ?? null,
    logo: data.logo ?? null,
    plano: (data.plano ?? 'basico') as PlanTipo,
    ativo: data.ativo ?? true,
    criado_em: toIsoString(data.criadoEm),
    configuracoes,
  }
}

function mapEmpresaUpdates(updates: UpdateEmpresa) {
  return cleanData({
    nome: updates.nome,
    cnpj: updates.cnpj,
    telefone: updates.telefone,
    email: updates.email,
    endereco: updates.endereco,
    logo: updates.logo,
    plano: updates.plano,
    ativo: updates.ativo,
  })
}

function mapConfiguracaoUpdates(updates: UpdateConfiguracao) {
  return cleanData({
    nomeFantasia: updates.nome_fantasia,
    moeda: updates.moeda,
    taxaServico: updates.taxa_servico,
    tema: updates.tema,
    impressoraPadrao: updates.impressora_padrao,
    aceitaPix: updates.aceita_pix,
    aceitaCartao: updates.aceita_cartao,
    aceitaDinheiro: updates.aceita_dinheiro,
    horarioFuncionamento: updates.horario_funcionamento,
  })
}

export async function getEmpresa(empresaId: string): Promise<EmpresaComConfiguracoes | null> {
  const [empresaSnap, configSnap] = await Promise.all([
    getDoc(doc(db, 'empresas', empresaId)),
    getDoc(doc(db, 'empresas', empresaId, 'configuracoes', 'config')),
  ])
  if (!empresaSnap.exists()) return null
  return mapEmpresa(empresaSnap.id, empresaSnap.data(), mapConfiguracao(empresaId, configSnap.data()))
}

export async function createEmpresa(empresaId: string, dados: {
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  plano?: string
}) {
  await setDoc(doc(db, 'empresas', empresaId), cleanData({
    ...dados,
    plano: dados.plano ?? 'basico',
    ativo: true,
    criadoEm: serverTimestamp(),
  }))
  await setDoc(doc(db, 'empresas', empresaId, 'configuracoes', 'config'), {
    nomeFantasia: dados.nome,
    moeda: 'BRL',
    taxaServico: 10,
    tema: 'light',
    aceitaPix: true,
    aceitaCartao: true,
    aceitaDinheiro: true,
    criadoEm: serverTimestamp(),
  })
  return { id: empresaId, ...dados, plano: dados.plano ?? 'basico', ativo: true }
}

export async function updateEmpresa(empresaId: string, updates: UpdateEmpresa) {
  await updateDoc(doc(db, 'empresas', empresaId), mapEmpresaUpdates(updates))
  return getEmpresa(empresaId)
}

export async function getConfiguracoes(empresaId: string) {
  const snap = await getDoc(doc(db, 'empresas', empresaId, 'configuracoes', 'config'))
  return mapConfiguracao(empresaId, snap.data())
}

export async function updateConfiguracoes(empresaId: string, updates: UpdateConfiguracao) {
  await updateDoc(doc(db, 'empresas', empresaId, 'configuracoes', 'config'), mapConfiguracaoUpdates(updates))
  return getConfiguracoes(empresaId)
}
