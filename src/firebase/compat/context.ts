export function getEmpresaId(explicitId?: string | null) {
  if (explicitId) return explicitId
  const savedId = typeof window === 'undefined' ? null : localStorage.getItem('vaultpos_empresa_id')
  if (!savedId) throw new Error('Empresa não encontrada para o usuário atual.')
  return savedId
}
