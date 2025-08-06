import { create } from 'zustand'
import { createSelectors } from '@/lib/utils'
import { checkHealth, LightragStatus } from '@/api/lightrag'

// ---------- Backend State ----------
interface BackendState {
  health: boolean
  message: string | null
  messageTitle: string | null
  status: LightragStatus | null
  lastCheckTime: number
  pipelineBusy: boolean
  check: () => Promise<boolean>
  clear: () => void
  setErrorMessage: (message: string, messageTitle: string) => void
  setPipelineBusy: (busy: boolean) => void
}

const useBackendStateStoreBase = create<BackendState>()((set) => ({
  health: true,
  message: null,
  messageTitle: null,
  lastCheckTime: Date.now(),
  status: null,
  pipelineBusy: false,

  check: async () => {
    const health = await checkHealth()
    if (health.status === 'healthy') {
      useAuthStore.getState().setVersion(health.core_version || null, health.api_version || null)
      useAuthStore.getState().setCustomTitle(health.webui_title ?? null, health.webui_description ?? null)
      set({ health: true, message: null, messageTitle: null, lastCheckTime: Date.now(), status: health, pipelineBusy: health.pipeline_busy })
      return true
    }
    set({ health: false, message: health.message, messageTitle: 'Backend Health Check Error!', lastCheckTime: Date.now(), status: null })
    return false
  },

  clear: () => set({ health: true, message: null, messageTitle: null }),
  setErrorMessage: (message, messageTitle) => set({ health: false, message, messageTitle }),
  setPipelineBusy: (busy) => set({ pipelineBusy: busy })
}))

export const useBackendState = createSelectors(useBackendStateStoreBase)


// ---------- Auth State ----------
interface AuthState {
  isAuthenticated: boolean
  role: string | null
  plan: string | null
  coreVersion: string | null
  apiVersion: string | null
  username: string | null
  webuiTitle: string | null
  webuiDescription: string | null

  login: (
    token: string,
    coreVersion?: string | null,
    apiVersion?: string | null,
    webuiTitle?: string | null,
    webuiDescription?: string | null,
    role?: string | null,
    plan?: string | null
  ) => void

  logout: () => void
  setVersion: (coreVersion: string | null, apiVersion: string | null) => void
  setCustomTitle: (webuiTitle: string | null, webuiDescription: string | null) => void
}

const parseTokenPayload = (token: string): { sub?: string } => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch (e) {
    console.error('Error parsing token:', e)
    return {}
  }
}

const getUsernameFromToken = (token: string): string | null => {
  const payload = parseTokenPayload(token)
  return payload.sub || null
}

const initAuthState = () => {
  const token = localStorage.getItem('LIGHTRAG-API-TOKEN')
  const coreVersion = localStorage.getItem('LIGHTRAG-CORE-VERSION')
  const apiVersion = localStorage.getItem('LIGHTRAG-API-VERSION')
  const webuiTitle = localStorage.getItem('LIGHTRAG-WEBUI-TITLE')
  const webuiDescription = localStorage.getItem('LIGHTRAG-WEBUI-DESCRIPTION')
  const role = localStorage.getItem('LIGHTRAG-ROLE')
  const plan = localStorage.getItem('LIGHTRAG-PLAN')
  const username = token ? getUsernameFromToken(token) : null

  return {
    isAuthenticated: !!token,
    role,
    plan,
    coreVersion,
    apiVersion,
    username,
    webuiTitle,
    webuiDescription
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const initialState = initAuthState()

  return {
    ...initialState,

    login: (token, coreVersion = null, apiVersion = null, webuiTitle = null, webuiDescription = null, role = null, plan = null) => {
      localStorage.setItem('LIGHTRAG-API-TOKEN', token)
      if (coreVersion) localStorage.setItem('LIGHTRAG-CORE-VERSION', coreVersion)
      if (apiVersion) localStorage.setItem('LIGHTRAG-API-VERSION', apiVersion)
      if (webuiTitle) localStorage.setItem('LIGHTRAG-WEBUI-TITLE', webuiTitle)
      else localStorage.removeItem('LIGHTRAG-WEBUI-TITLE')
      if (webuiDescription) localStorage.setItem('LIGHTRAG-WEBUI-DESCRIPTION', webuiDescription)
      else localStorage.removeItem('LIGHTRAG-WEBUI-DESCRIPTION')
      if (role) localStorage.setItem('LIGHTRAG-ROLE', role)
      else localStorage.removeItem('LIGHTRAG-ROLE')
      if (plan) localStorage.setItem('LIGHTRAG-PLAN', plan)
      else localStorage.removeItem('LIGHTRAG-PLAN')

      const username = getUsernameFromToken(token)

      set({
        isAuthenticated: true,
        username,
        coreVersion,
        apiVersion,
        webuiTitle,
        webuiDescription,
        role,
        plan
      })
    },

    logout: () => {
      localStorage.removeItem('LIGHTRAG-API-TOKEN')
      localStorage.removeItem('LIGHTRAG-ROLE')
      localStorage.removeItem('LIGHTRAG-PLAN')

      const coreVersion = localStorage.getItem('LIGHTRAG-CORE-VERSION')
      const apiVersion = localStorage.getItem('LIGHTRAG-API-VERSION')
      const webuiTitle = localStorage.getItem('LIGHTRAG-WEBUI-TITLE')
      const webuiDescription = localStorage.getItem('LIGHTRAG-WEBUI-DESCRIPTION')

      set({
        isAuthenticated: false,
        role: null,
        plan: null,
        username: null,
        coreVersion,
        apiVersion,
        webuiTitle,
        webuiDescription
      })
    },

    setVersion: (coreVersion, apiVersion) => {
      if (coreVersion) localStorage.setItem('LIGHTRAG-CORE-VERSION', coreVersion)
      if (apiVersion) localStorage.setItem('LIGHTRAG-API-VERSION', apiVersion)
      set({ coreVersion, apiVersion })
    },

    setCustomTitle: (webuiTitle, webuiDescription) => {
      if (webuiTitle) localStorage.setItem('LIGHTRAG-WEBUI-TITLE', webuiTitle)
      else localStorage.removeItem('LIGHTRAG-WEBUI-TITLE')
      if (webuiDescription) localStorage.setItem('LIGHTRAG-WEBUI-DESCRIPTION', webuiDescription)
      else localStorage.removeItem('LIGHTRAG-WEBUI-DESCRIPTION')
      set({ webuiTitle, webuiDescription })
    }
  }
})
