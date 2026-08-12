import {
  getConfiguracoes,
  getEmpresa as getFirebaseEmpresa,
  updateConfiguracoes,
  updateEmpresa,
} from '@/firebase/collections/empresas'

export { getConfiguracoes, updateConfiguracoes, updateEmpresa }

export async function getEmpresa(empresaId: string) {
  const company = await getFirebaseEmpresa(empresaId)
  if (!company) throw new Error('Empresa não encontrada.')
  return company
}
