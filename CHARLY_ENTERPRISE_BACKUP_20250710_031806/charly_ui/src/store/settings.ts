import { create } from 'zustand'
import type { SettingsState } from '@/types/settings'

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
      tone: (backendData.narrative_defaults?.tone as any) ?? 'professional',
      includeMarketAnalysis: backendData.narrative_defaults?.include_market_analysis ?? true,
      includePhotoEvidence: backendData.narrative_defaults?.include_photo_evidence ?? true,
      templatePreference: (backendData.narrative_defaults?.template_preference as any) ?? 'comprehensive',
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
      const response = await fetch('/api/settings/')
      
      if (!response.ok) {
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
      const message = error instanceof Error ? error.message : 'Failed to fetch settings'
      set({ 
        loading: false, 
        error: message 
      })
      throw error
    }
  },
  
  // Update settings via API
  updateSettings: async (newSettings) => {
    set({ loading: true, error: null })
    
    try {
      const payload = mapFrontendToBackend(newSettings)
      
      const response = await fetch('/api/settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
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
      const message = error instanceof Error ? error.message : 'Failed to update settings'
      set({ 
        loading: false, 
        error: message 
      })
      throw error
    }
  },
  
  // Reset settings to defaults
  resetSettings: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await fetch('/api/settings/reset', {
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