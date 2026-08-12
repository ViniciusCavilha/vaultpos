import { auth } from '@/firebase/config'
import { reauthenticateCurrentUser, updateCurrentPassword } from '@/firebase/auth'
import { getAllUsuarios } from '@/firebase/collections/usuarios'
import { getEmpresaId } from '@/firebase/compat/context'
import type { Usuario } from '@/types/database.types'

interface QueryResult<T> {
  data: T
  error: Error | null
}

class UsuariosQuery {
  private empresaId: string | null = null

  select(...fields: unknown[]) { void fields; return this }

  eq(field: string, value: unknown) {
    if (field === 'empresa_id') this.empresaId = String(value)
    return this
  }

  async order(...fields: unknown[]): Promise<QueryResult<Usuario[]>> {
    void fields
    try {
      return { data: await getAllUsuarios(getEmpresaId(this.empresaId)), error: null }
    } catch (caught) {
      const error = caught instanceof Error ? caught : new Error('Erro ao carregar usuários.')
      return { data: [], error }
    }
  }
}

export const supabase = {
  auth: {
    async signInWithPassword(credentials: { email: string; password: string }) {
      try {
        await reauthenticateCurrentUser(credentials.email, credentials.password)
        return { data: { user: auth.currentUser }, error: null }
      } catch (caught) {
        return { data: { user: null }, error: caught instanceof Error ? caught : new Error('Falha na autenticação.') }
      }
    },
    async updateUser(updates: { password?: string }) {
      try {
        if (updates.password) await updateCurrentPassword(updates.password)
        return { data: { user: auth.currentUser }, error: null }
      } catch (caught) {
        return { data: { user: auth.currentUser }, error: caught instanceof Error ? caught : new Error('Falha ao atualizar usuário.') }
      }
    },
  },
  from(table: string) {
    if (table !== 'usuarios') throw new Error(`Coleção não suportada: ${table}`)
    return new UsuariosQuery()
  },
}
