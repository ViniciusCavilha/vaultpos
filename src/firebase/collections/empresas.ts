import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import {
  numericValue,
  optionalString,
  toIsoString,
  withoutUndefined,
} from '@/firebase/utils'
import type {
  EmpresaComConfiguracoes,
  PlanTipo,
  UpdateConfiguracao,
  UpdateEmpresa as EmpresaUpdates,
} from '@/types/database.types'

function configurationReference(empresaId: string) {
  return doc(db, 'empresas', empresaId, 'configuracoes', 'config')
}

export async function getEmpresa(
  empresaId: string,
): Promise<EmpresaComConfiguracoes | null> {
  const [empresaSnapshot, configurationSnapshot] = await Promise.all([
    getDoc(doc(db, 'empresas', empresaId)),
    getDoc(configurationReference(empresaId)),
  ])

  if (!empresaSnapshot.exists()) return null

  const data = empresaSnapshot.data()
  const configuration = configurationSnapshot.exists()
    ? configurationSnapshot.data()
    : null

  return {
    id: empresaSnapshot.id,
    nome: String(data.nome ?? ''),
    cnpj: optionalString(data.cnpj),
    telefone: optionalString(data.telefone),
    email: optionalString(data.email),
    endereco: optionalString(data.endereco),
    logo: optionalString(data.logo),
    plano: (data.plano ?? 'basico') as PlanTipo,
    ativo: data.ativo !== false,
    criado_em: toIsoString(data.criadoEm),
    configuracoes: configuration
      ? {
          id: configurationSnapshot.id,
          empresa_id: empresaId,
          nome_fantasia: optionalString(configuration.nomeFantasia),
          moeda: String(configuration.moeda ?? 'BRL'),
          taxa_servico: numericValue(configuration.taxaServico, 10),
          tema: String(configuration.tema ?? 'light'),
          impressora_padrao: optionalString(configuration.impressoraPadrao),
          aceita_pix: configuration.aceitaPix !== false,
          aceita_cartao: configuration.aceitaCartao !== false,
          aceita_dinheiro: configuration.aceitaDinheiro !== false,
          horario_funcionamento:
            (configuration.horarioFuncionamento as Record<string, unknown>) ?? null,
          criado_em: toIsoString(configuration.criadoEm),
        }
      : null,
  }
}

export async function createEmpresa(
  empresaId: string,
  dados: {
    nome: string
    cnpj?: string
    telefone?: string
    email?: string
    endereco?: string
    plano?: PlanTipo
  },
): Promise<EmpresaComConfiguracoes | null> {
  await Promise.all([
    setDoc(
      doc(db, 'empresas', empresaId),
      withoutUndefined({
        ...dados,
        plano: dados.plano ?? 'basico',
        ativo: true,
        criadoEm: serverTimestamp(),
      }),
    ),
    setDoc(configurationReference(empresaId), {
      nomeFantasia: dados.nome,
      moeda: 'BRL',
      taxaServico: 10,
      tema: 'light',
      aceitaPix: true,
      aceitaCartao: true,
      aceitaDinheiro: true,
      criadoEm: serverTimestamp(),
    }),
  ])

  return getEmpresa(empresaId)
}

export async function updateEmpresa(
  empresaId: string,
  updates: EmpresaUpdates,
): Promise<EmpresaComConfiguracoes | null> {
  await updateDoc(
    doc(db, 'empresas', empresaId),
    withoutUndefined({
      nome: updates.nome,
      cnpj: updates.cnpj,
      telefone: updates.telefone,
      email: updates.email,
      endereco: updates.endereco,
      logo: updates.logo,
      plano: updates.plano,
      ativo: updates.ativo,
    }),
  )

  return getEmpresa(empresaId)
}

export async function getConfiguracoes(empresaId: string) {
  const snapshot = await getDoc(configurationReference(empresaId))
  return snapshot.exists() ? snapshot.data() : null
}

export async function updateConfiguracoes(
  empresaId: string,
  updates: UpdateConfiguracao,
) {
  await setDoc(
    configurationReference(empresaId),
    withoutUndefined({
      nomeFantasia: updates.nome_fantasia,
      moeda: updates.moeda,
      taxaServico: updates.taxa_servico,
      tema: updates.tema,
      impressoraPadrao: updates.impressora_padrao,
      aceitaPix: updates.aceita_pix,
      aceitaCartao: updates.aceita_cartao,
      aceitaDinheiro: updates.aceita_dinheiro,
      horarioFuncionamento: updates.horario_funcionamento,
    }),
    { merge: true },
  )

  return getConfiguracoes(empresaId)
}
