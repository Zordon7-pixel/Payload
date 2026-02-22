export function getTokenPayload() {
  const token = localStorage.getItem('hc_token')
  if (!token) return null
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}

export function getRole()         { return getTokenPayload()?.role || null }
export function isOwner()         { const r = getRole(); return r === 'owner' || r === 'owner_operator' }
export function isDriver()        { const r = getRole(); return r === 'driver' || r === 'owner_operator' }
export function isPureDriver()    { return getRole() === 'driver' }
export function isOwnerOperator() { return getRole() === 'owner_operator' }
