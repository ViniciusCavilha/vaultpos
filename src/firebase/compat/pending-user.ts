const pendingUsers = new Map<string, string>()

function normalizedEmail(email: string) {
  return email.trim().toLowerCase()
}

export function setPendingUserId(email: string, uid: string) {
  pendingUsers.set(normalizedEmail(email), uid)
}

export function consumePendingUserId(email: string) {
  const key = normalizedEmail(email)
  const uid = pendingUsers.get(key)
  pendingUsers.delete(key)
  return uid
}
