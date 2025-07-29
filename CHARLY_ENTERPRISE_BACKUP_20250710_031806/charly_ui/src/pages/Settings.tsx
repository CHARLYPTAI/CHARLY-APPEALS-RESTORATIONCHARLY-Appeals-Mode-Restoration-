import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store/settings'
import { useToast } from '@/components/ui/use-toast'
import type { NarrativeDefaults } from '@/types/settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function Settings() {
  const {
    identity,
    branding,
    ai,
    billing,
    updateSettings,
    fetchSettings,
    loading,
    error,
  } = useSettingsStore()
  
  const { toast } = useToast()
  
  const [localSettings, setLocalSettings] = useState({
    firmName: identity.firmName,
    filingEntity: identity.filingEntity,
    licenseNumber: identity.licenseNumber,
    defaultJurisdictions: branding.defaultJurisdictions.join(', '),
    enableWatermark: branding.enableWatermark,
    enableNarrative: ai.enableNarrative,
    rolePermissions: {
      canEditSettings: true,
      canViewBilling: true,
      canManageUsers: true,
      canAccessReports: true,
    },
    narrativeDefaults: {
      tone: 'professional' as NarrativeDefaults['tone'],
      includeMarketAnalysis: true,
      includePhotoEvidence: true,
      templatePreference: 'comprehensive' as NarrativeDefaults['templatePreference'],
    },
  })

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings().catch((error) => {
      console.error('Failed to fetch settings:', error)
      toast({ 
        title: 'Failed to load settings', 
        description: 'Using default values',
        variant: 'destructive' 
      })
    })
  }, [fetchSettings])

  // Update local state when store changes
  useEffect(() => {
    setLocalSettings({
      firmName: identity.firmName,
      filingEntity: identity.filingEntity,
      licenseNumber: identity.licenseNumber,
      defaultJurisdictions: branding.defaultJurisdictions.join(', '),
      enableWatermark: branding.enableWatermark,
      enableNarrative: ai.enableNarrative,
      rolePermissions: {
        canEditSettings: true,
        canViewBilling: true,
        canManageUsers: true,
        canAccessReports: true,
      },
      narrativeDefaults: {
        tone: 'professional' as NarrativeDefaults['tone'],
        includeMarketAnalysis: true,
        includePhotoEvidence: true,
        templatePreference: 'comprehensive' as NarrativeDefaults['templatePreference'],
      },
    })
  }, [identity, branding, ai])

  const handleSave = async () => {
    try {
      await updateSettings({
        identity: {
          firmName: localSettings.firmName,
          filingEntity: localSettings.filingEntity,
          licenseNumber: localSettings.licenseNumber,
        },
        branding: {
          defaultJurisdictions: localSettings.defaultJurisdictions
            .split(',')
            .map((j) => j.trim())
            .filter(j => j.length > 0),
          enableWatermark: localSettings.enableWatermark,
        },
        ai: {
          enableNarrative: localSettings.enableNarrative,
        },
        rolePermissions: localSettings.rolePermissions,
        narrativeDefaults: localSettings.narrativeDefaults,
      })
      toast({ title: 'Settings saved successfully!' })
    } catch {
      toast({ title: 'Error saving settings.', variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-500">Manage your firm preferences and configurations</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 text-sm">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Firm Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏢 Firm Identity
            </CardTitle>
            <CardDescription>
              Basic information about your firm and filing entity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="firmName">Firm Name</Label>
              <Input
                id="firmName"
                value={localSettings.firmName}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, firmName: e.target.value })
                }
                placeholder="Enter your firm name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filingEntity">Filing Entity</Label>
              <Input
                id="filingEntity"
                value={localSettings.filingEntity}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    filingEntity: e.target.value,
                  })
                }
                placeholder="Enter filing entity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={localSettings.licenseNumber}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    licenseNumber: e.target.value,
                  })
                }
                placeholder="Enter license number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding & Jurisdictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎨 Branding & Jurisdictions
            </CardTitle>
            <CardDescription>
              Configure your default jurisdictions and branding preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="jurisdictions">Default Jurisdictions</Label>
              <Textarea
                id="jurisdictions"
                value={localSettings.defaultJurisdictions}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    defaultJurisdictions: e.target.value,
                  })
                }
                placeholder="Enter jurisdictions separated by commas"
                className="min-h-[60px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Watermark</Label>
                <div className="text-sm text-zinc-500">
                  Add firm watermark to generated documents
                </div>
              </div>
              <Switch
                checked={localSettings.enableWatermark}
                onCheckedChange={(checked: boolean) =>
                  setLocalSettings({
                    ...localSettings,
                    enableWatermark: checked,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* AI & Narrative Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI & Narrative Settings
            </CardTitle>
            <CardDescription>
              Configure AI-powered narrative generation preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable AI Narratives</Label>
                <div className="text-sm text-zinc-500">
                  Use AI to generate property appeal narratives
                </div>
              </div>
              <Switch
                checked={localSettings.enableNarrative}
                onCheckedChange={(checked: boolean) =>
                  setLocalSettings({
                    ...localSettings,
                    enableNarrative: checked,
                  })
                }
              />
            </div>

            {localSettings.enableNarrative && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="tone">Narrative Tone</Label>
                  <Select
                    value={localSettings.narrativeDefaults.tone}
                    onValueChange={(value: string) =>
                      setLocalSettings({
                        ...localSettings,
                        narrativeDefaults: {
                          ...localSettings.narrativeDefaults,
                          tone: value as NarrativeDefaults['tone'],
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="template">Template Preference</Label>
                  <Select
                    value={localSettings.narrativeDefaults.templatePreference}
                    onValueChange={(value: string) =>
                      setLocalSettings({
                        ...localSettings,
                        narrativeDefaults: {
                          ...localSettings.narrativeDefaults,
                          templatePreference: value as NarrativeDefaults['templatePreference'],
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Market Analysis</Label>
                    <div className="text-sm text-zinc-500">
                      Add market analysis to narratives
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.narrativeDefaults.includeMarketAnalysis}
                    onCheckedChange={(checked: boolean) =>
                      setLocalSettings({
                        ...localSettings,
                        narrativeDefaults: {
                          ...localSettings.narrativeDefaults,
                          includeMarketAnalysis: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Photo Evidence</Label>
                    <div className="text-sm text-zinc-500">
                      Include property photos in narratives
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.narrativeDefaults.includePhotoEvidence}
                    onCheckedChange={(checked: boolean) =>
                      setLocalSettings({
                        ...localSettings,
                        narrativeDefaults: {
                          ...localSettings.narrativeDefaults,
                          includePhotoEvidence: checked,
                        },
                      })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💳 Billing Information
            </CardTitle>
            <CardDescription>
              Current plan and usage information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Current Plan</Label>
                <p className="text-2xl font-bold">{billing.planLevel}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">AI Credits Remaining</Label>
                <p className="text-2xl font-bold">{billing.gptCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          size="lg"
          className="px-8"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}