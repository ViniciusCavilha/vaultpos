import { createSecondaryUser } from '@/firebase/auth'
import { setPendingUserId } from '@/firebase/compat/pending-user'

interface SignUpCredentials {
  email: string
  password: string
  options?: {
    data?: Record<string, unknown>
  }
}

export function createClient(...configuration: unknown[]) {
  void configuration
  return {
    auth: {
      async signUp(credentials: SignUpCredentials) {
        try {
          const user = await createSecondaryUser(
            credentials.email,
            credentials.password,
            credentials.options?.data,
          )
          setPendingUserId(credentials.email, user.uid)
          return {
            data: { user: { id: user.uid, uid: user.uid, email: user.email } },
            error: null,
          }
        } catch (caught) {
          return {
            data: { user: null },
            error: caught instanceof Error ? caught : new Error('Não foi possível criar o usuário.'),
          }
        }
      },
    },
  }
}
