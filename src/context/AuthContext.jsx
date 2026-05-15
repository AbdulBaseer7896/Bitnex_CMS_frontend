import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/users/me/')
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  // ── Legacy feature check — kept so older pages that still call
  // hasFeature('view_salary') keep working.
  const hasFeature = (feature) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.features?.[feature] !== false
  }

  // ── NEW: module check. The backend ships `user.modules` (an array of
  // module slugs) on /users/me/. Admin always returns true as a safety net
  // even if the array somehow shipped empty.
  const hasModule = (slug) => {
    if (!user) return false
    if (user.role === 'admin') return true
    const mods = user.modules
    if (!Array.isArray(mods)) return false
    return mods.includes(slug)
  }

  // Refresh the current user from the server. Useful after the admin grants
  // a module to themself or any time `user.modules` may have changed.
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/users/me/')
      setUser(data)
      return data
    } catch {
      return null
    }
  }

  return (
    <AuthContext.Provider value={{
      user, login, logout, loading,
      hasFeature, hasModule, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
