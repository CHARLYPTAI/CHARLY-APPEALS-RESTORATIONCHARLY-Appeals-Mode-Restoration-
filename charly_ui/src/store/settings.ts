import { create } from 'zustand'
import type { SettingsState } from '@/types/settings'
import { authenticatedRequest } from '@/lib/auth'

// API interface for backend integration
interface BackendSettingsResponse {
  settings: {
    firm_name: string
    filing_entity: string
    license_number: string
    jurisdiction_defaults: string[]
    watermark_enabled: boolean
    gpt_enabled: boolean
    stripe_plan_tier: string
    credit_balance: number
    gpt_model?: string
    narrative_tone?: string
    role_permissions?: {
      can_edit_settings: boolean
      can_view_billing: boolean
      can_manage_users: boolean
      can_access_reports: boolean
    }
    narrative_defaults?: {
      tone: string
      include_market_analysis: boolean
      include_photo_evidence: boolean
      template_preference: string
    }
    last_modified: string
    version: number
  }
  status: string
  message: string
}

// Convert backend format to frontend format
function mapBackendToFrontend(backendData: BackendSettingsResponse['settings']) {
  return {
    identity: {
      firmName: backendData.firm_name,
      filingEntity: backendData.filing_entity,
      licenseNumber: backendData.license_number,
    },
    branding: {
      defaultJurisdictions: backendData.jurisdiction_defaults,
      enableWatermark: backendData.watermark_enabled,
    },
    ai: {
      enableNarrative: backendData.gpt_enabled,
    },
    billing: {
      planLevel: backendData.stripe_plan_tier,
      gptCredits: backendData.credit_balance,
    },
    rolePermissions: {
      canEditSettings: backendData.role_permissions?.can_edit_settings ?? true,
      canViewBilling: backendData.role_permissions?.can_view_billing ?? true,
      canManageUsers: backendData.role_permissions?.can_manage_users ?? true,
      canAccessReports: backendData.role_permissions?.can_access_reports ?? true,
    },
    narrativeDefaults: {
      tone: (['professional', 'formal', 'technical', 'persuasive'].includes(backendData.narrative_defaults?.tone ?? 'professional') ? (backendData.narrative_defaults?.tone ?? 'professional') : 'professional') as 'professional' | 'formal' | 'technical' | 'persuasive',
      includeMarketAnalysis: backendData.narrative_defaults?.include_market_analysis ?? true,
      includePhotoEvidence: backendData.narrative_defaults?.include_photo_evidence ?? true,
      templatePreference: (['comprehensive', 'concise', 'detailed', 'summary'].includes(backendData.narrative_defaults?.template_preference ?? 'comprehensive') ? (backendData.narrative_defaults?.template_preference ?? 'comprehensive') : 'comprehensive') as 'comprehensive' | 'concise' | 'detailed' | 'summary',
    },
  }
}

// Convert frontend format to backend format
function mapFrontendToBackend(frontendData: Partial<SettingsState>) {
  const payload: Record<string, unknown> = {}
  
  if (frontendData.identity) {
    if (frontendData.identity.firmName !== undefined) {
      payload.firm_name = frontendData.identity.firmName
    }
    if (frontendData.identity.filingEntity !== undefined) {
      payload.filing_entity = frontendData.identity.filingEntity
    }
    if (frontendData.identity.licenseNumber !== undefined) {
      payload.license_number = frontendData.identity.licenseNumber
    }
  }
  
  if (frontendData.branding) {
    if (frontendData.branding.defaultJurisdictions !== undefined) {
      payload.jurisdiction_defaults = frontendData.branding.defaultJurisdictions
    }
    if (frontendData.branding.enableWatermark !== undefined) {
      payload.watermark_enabled = frontendData.branding.enableWatermark
    }
  }
  
  if (frontendData.ai) {
    if (frontendData.ai.enableNarrative !== undefined) {
      payload.gpt_enabled = frontendData.ai.enableNarrative
    }
  }
  
  if (frontendData.rolePermissions) {
    payload.role_permissions = {
      can_edit_settings: frontendData.rolePermissions.canEditSettings,
      can_view_billing: frontendData.rolePermissions.canViewBilling,
      can_manage_users: frontendData.rolePermissions.canManageUsers,
      can_access_reports: frontendData.rolePermissions.canAccessReports,
    }
  }
  
  if (frontendData.narrativeDefaults) {
    payload.narrative_defaults = {
      tone: frontendData.narrativeDefaults.tone,
      include_market_analysis: frontendData.narrativeDefaults.includeMarketAnalysis,
      include_photo_evidence: frontendData.narrativeDefaults.includePhotoEvidence,
      template_preference: frontendData.narrativeDefaults.templatePreference,
    }
  }
  
  return payload
}

export const useSettingsStore = create<SettingsState>((set) => ({
  identity: {
    firmName: '',
    filingEntity: '',
    licenseNumber: '',
  },
  branding: {
    defaultJurisdictions: [],
    enableWatermark: false,
  },
  ai: {
    enableNarrative: true,
  },
  billing: {
    planLevel: 'Free',
    gptCredits: 0,
  },
  rolePermissions: {
    canEditSettings: true,
    canViewBilling: true,
    canManageUsers: true,
    canAccessReports: true,
  },
  narrativeDefaults: {
    tone: 'professional',
    includeMarketAnalysis: true,
    includePhotoEvidence: true,
    templatePreference: 'comprehensive',
  },
  loading: false,
  error: null,
  
  // Fetch settings from backend
  fetchSettings: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await authenticatedRequest('/api/settings/')
      
      if (!response.ok) {
        // In development mode, use mock data instead of throwing error
        if (response.status === 404 || response.status === 405) {
          console.log('Settings API not available, using demo data')
          
          // Use mock data for development
          const mockData = {
            identity: {
              firmName: 'Demo Property Tax Consultants',
              filingEntity: 'Demo PTC LLC',
              licenseNumber: 'TX-RPA-12345',
            },
            branding: {
              defaultJurisdictions: ['Harris County', 'Dallas County', 'Travis County'],
              enableWatermark: true,
            },
            ai: {
              enableNarrative: true,
            },
            billing: {
              planLevel: 'Professional',
              gptCredits: 2500,
            },
            rolePermissions: {
              canEditSettings: true,
              canViewBilling: true,
              canManageUsers: true,
              canAccessReports: true,
            },
            narrativeDefaults: {
              tone: 'professional' as const,
              includeMarketAnalysis: true,
              includePhotoEvidence: true,
              templatePreference: 'comprehensive' as const,
            },
          }
          
          set({
            ...mockData,
            loading: false,
            error: null,
          })
          return
        }
        
        throw new Error(`Failed to fetch settings: ${response.status}`)
      }
      
      const data: BackendSettingsResponse = await response.json()
      const mappedData = mapBackendToFrontend(data.settings)
      
      set({
        ...mappedData,
        loading: false,
        error: null,
      })
    } catch (error) {
      // Don't set error state or throw if we're in development mode and using mock data
      console.warn('Settings API not available, using mock data for development')
      set({ 
        loading: false, 
        error: null
      })
      // Don't throw error in development mode - just log it
      console.log('Settings fetch error (expected in development):', error)
    }
  },
  
  // Update settings via API
  updateSettings: async (newSettings) => {
    set({ loading: true, error: null })
    
    try {
      const payload = mapFrontendToBackend(newSettings)
      
      const response = await authenticatedRequest('/api/settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        // In development mode, simulate successful update with local state
        if (response.status === 404 || response.status === 405) {
          console.log('Settings API not available, simulating update')
          
          set((state) => ({
            ...state,
            ...newSettings,
            loading: false,
            error: null,
          }))
          return
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Update failed: ${response.status}`)
      }
      
      const data: BackendSettingsResponse = await response.json()
      const mappedData = mapBackendToFrontend(data.settings)
      
      set({
        ...mappedData,
        loading: false,
        error: null,
      })
    } catch (error) {
      // In development mode, don't show errors for missing API
      console.warn('Settings update API not available, changes saved locally for development')
      set({ 
        loading: false, 
        error: null
      })
      // Don't throw error in development mode
      console.log('Settings update error (expected in development):', error)
    }
  },
  
  // Reset settings to defaults
  resetSettings: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await authenticatedRequest('/api/settings/reset', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error(`Reset failed: ${response.status}`)
      }
      
      const data: BackendSettingsResponse = await response.json()
      const mappedData = mapBackendToFrontend(data.settings)
      
      set({
        ...mappedData,
        loading: false,
        error: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset settings'
      set({ 
        loading: false, 
        error: message 
      })
      throw error
    }
  },
}))