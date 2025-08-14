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
import ClientPortalWhiteLabel from '@/components/ClientPortalWhiteLabel'
import JurisdictionDropdown from '@/components/JurisdictionDropdown'
import { getJurisdictionById } from '@/services/jurisdictionService'

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
      // Only show error toast if it's a real API error, not development mode
      if (error?.message && !error.message.includes('404')) {
        console.error('Failed to fetch settings:', error)
        toast({ 
          title: 'Failed to load settings', 
          description: 'Using default values',
          variant: 'destructive' 
        })
      }
    })
  }, [fetchSettings, toast])

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

  const handleReset = () => {
    // Reset to default values
    setLocalSettings({
      firmName: 'CHARLY Property Tax Consultants',
      filingEntity: 'CHARLY LLC',
      licenseNumber: 'TX-123456',
      defaultJurisdictions: 'Harris County, TX, Travis County, TX',
      enableWatermark: true,
      enableNarrative: true,
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
    });
    
    toast({ 
      title: 'Settings Reset', 
      description: 'All settings have been reset to default values.' 
    });
  };

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
              <div className="space-y-2">
                <JurisdictionDropdown
                  value=""
                  onValueChange={(value) => {
                    const selectedJurisdiction = getJurisdictionById(value);
                    if (selectedJurisdiction) {
                      const currentJurisdictions = localSettings.defaultJurisdictions
                        .split(',')
                        .map(j => j.trim())
                        .filter(j => j.length > 0);
                      
                      if (!currentJurisdictions.includes(selectedJurisdiction.fullName)) {
                        currentJurisdictions.push(selectedJurisdiction.fullName);
                        setLocalSettings({
                          ...localSettings,
                          defaultJurisdictions: currentJurisdictions.join(', ')
                        });
                      }
                    }
                  }}
                  placeholder="Add jurisdiction"
                  simplified={true}
                />
                <Textarea
                  id="jurisdictions"
                  value={localSettings.defaultJurisdictions}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      defaultJurisdictions: e.target.value,
                    })
                  }
                  placeholder="Selected jurisdictions will appear here"
                  className="min-h-[60px]"
                />
                <p className="text-xs text-gray-500">
                  Select from the dropdown above or manually edit the text field
                </p>
              </div>
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

        {/* Deadline & Calendar Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Deadline Management
            </CardTitle>
            <CardDescription>
              Configure deadline tracking and calendar integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alertDays">Alert Days Before Deadline</Label>
                <Select defaultValue="14">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="21">21 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Select defaultValue="America/Chicago">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="email-alerts" defaultChecked />
              <Label htmlFor="email-alerts">Send email alerts for approaching deadlines</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="calendar-sync" defaultChecked />
              <Label htmlFor="calendar-sync">Sync deadlines with calendar</Label>
            </div>
          </CardContent>
        </Card>

        {/* Data Management Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💾 Data Management
            </CardTitle>
            <CardDescription>
              Configure data backup, retention, and file handling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-retention">Data Retention (Days)</Label>
                <Input type="number" defaultValue="2555" min="365" max="7300" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
              <Input type="number" defaultValue="50" min="1" max="500" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="auto-backup" defaultChecked />
              <Label htmlFor="auto-backup">Enable automatic backups</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="auto-save" defaultChecked />
              <Label htmlFor="auto-save">Auto-save work in progress</Label>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔔 Notification Preferences
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Appeal Filing Confirmations</Label>
                  <p className="text-xs text-gray-600">Get notified when appeals are successfully filed</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Status Updates</Label>
                  <p className="text-xs text-gray-600">Receive updates on appeal status changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Weekly Reports</Label>
                  <p className="text-xs text-gray-600">Weekly summary of activity and progress</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Flagged Properties Alerts</Label>
                  <p className="text-xs text-gray-600">Get notified when new properties are flagged</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">System Maintenance</Label>
                  <p className="text-xs text-gray-600">Notifications about system updates and maintenance</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚙️ System Preferences
            </CardTitle>
            <CardDescription>
              Configure system behavior and interface preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Interface Theme</Label>
                <Select defaultValue="light">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-rate-limit">API Rate Limit (requests/minute)</Label>
              <Input type="number" defaultValue="1000" min="100" max="5000" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="enhanced-logging" />
              <Label htmlFor="enhanced-logging">Enable enhanced logging for debugging</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="analytics" defaultChecked />
              <Label htmlFor="analytics">Allow anonymous usage analytics</Label>
            </div>
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
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usage this month</span>
                <span className="font-medium">47 API calls</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Last billing date</span>
                <span className="font-medium">July 1, 2025</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Next billing date</span>
                <span className="font-medium">August 1, 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Portal & White-Label Solutions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌐 Client Portal & White-Label Solutions
            </CardTitle>
            <CardDescription>
              Manage branded client portals and white-label solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientPortalWhiteLabel />
          </CardContent>
        </Card>
      </div>

      {/* Save and Reset Buttons */}
      <div className="flex justify-end gap-3 pt-6">
        <Button 
          onClick={handleReset} 
          variant="outline"
          size="lg"
          className="px-8"
        >
          Reset to Defaults
        </Button>
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

export default Settings;