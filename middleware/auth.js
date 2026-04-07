export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  // Skip middleware if already navigating to prevent redirect loops
  if (to.path === '/login') return

  const token = localStorage.getItem('pos_token')

  // No token - redirect to login
  if (!token) {
    return navigateTo('/login')
  }

  // Check token expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      return navigateTo('/login')
    }
  } catch {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    return navigateTo('/login')
  }

  // RBAC: restrict /admin routes to SUPERADMIN only
  if (to.path.startsWith('/admin')) {
    try {
      const user = JSON.parse(localStorage.getItem('pos_user') || '{}')
      if (user.role !== 'SUPERADMIN') {
        return navigateTo('/')
      }
    } catch {
      return navigateTo('/')
    }
  }
})
