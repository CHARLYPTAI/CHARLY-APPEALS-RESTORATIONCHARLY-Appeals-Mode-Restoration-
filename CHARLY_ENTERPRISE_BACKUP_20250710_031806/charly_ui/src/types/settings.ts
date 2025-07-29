export interface FirmIdentity {
  firmName: string
  filingEntity: string
  licenseNumber: string
}

export interface BrandingPrefs {
  defaultJurisdictions: string[]
  enableWatermark: boolean
}

export interface AIPreferences {
  enableNarrative: boolean
}

export interface BillingInfo {
  planLevel: string
  gptCredits: number
}

export interface RolePermissions {
  canEditSettings: boolean
  canViewBilling: boolean
  canManageUsers: boolean
  canAccessReports: boolean
}

export interface NarrativeDefaults {
  tone: 'professional' | 'formal' | 'technical' | 'persuasive'
  includeMarketAnalysis: boolean
  includePhotoEvidence: boolean
  templatePreference: 'comprehensive' | 'concise' | 'detailed' | 'summary'
}

export interface SettingsState {
  identity: FirmIdentity
  branding: BrandingPrefs
  ai: AIPreferences
  billing: BillingInfo
  rolePermissions: RolePermissions
  narrativeDefaults: NarrativeDefaults
  loading: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<SettingsState>) => Promise<void>
  resetSettings: () => Promise<void>
}