'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registrationSchema = z.object({
  organization: z.object({
    name: z.string().min(1, 'Organization name is required'),
    type: z.enum(['property_management', 'commercial_real_estate', 'law_firm', 'other']),
    size: z.enum(['small', 'medium', 'large', 'enterprise']),
    address: z.object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(2, 'State is required'),
      zip: z.string().min(5, 'ZIP code is required'),
      country: z.string().default('US')
    }),
    phone: z.string().min(10, 'Phone number is required'),
    website: z.string().url().optional().or(z.literal(''))
  }),
  primary_contact: z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Phone number is required'),
    title: z.string().min(1, 'Title is required')
  }),
  jurisdictions: z.array(z.string()).min(1, 'At least one jurisdiction is required'),
  expected_monthly_appeals: z.number().min(1, 'Expected monthly appeals must be at least 1'),
  integration_preferences: z.object({
    api_access: z.boolean().default(false),
    webhook_url: z.string().url().optional().or(z.literal('')),
    sso_required: z.boolean().default(false),
    white_label: z.boolean().default(false)
  })
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      organization: {
        country: 'US'
      },
      integration_preferences: {
        api_access: false,
        sso_required: false,
        white_label: false
      }
    }
  });

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/onboarding/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const result = await response.json();
      setRegistrationResult(result);
      setStep(5);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableJurisdictions = [
    { id: 'harris-county-tx', name: 'Harris County, TX' },
    { id: 'cook-county-il', name: 'Cook County, IL' },
    { id: 'maricopa-county-az', name: 'Maricopa County, AZ' }
  ];

  const selectedJurisdictions = watch('jurisdictions') || [];

  const toggleJurisdiction = (jurisdictionId: string) => {
    const current = selectedJurisdictions;
    const updated = current.includes(jurisdictionId)
      ? current.filter(id => id !== jurisdictionId)
      : [...current, jurisdictionId];
    setValue('jurisdictions', updated);
  };

  if (step === 5 && registrationResult) {
    return (
      <div className="onboarding-success">
        <div className="card">
          <h1>Welcome to CHARLY!</h1>
          <p>Your commercial account has been successfully created.</p>
          
          <div className="result-details">
            <div className="detail-item">
              <label>Customer ID:</label>
              <code>{registrationResult.customer_id}</code>
            </div>
            <div className="detail-item">
              <label>API Key:</label>
              <code>{registrationResult.api_key}</code>
            </div>
          </div>

          <div className="next-steps">
            <h3>Next Steps:</h3>
            <ul>
              {registrationResult.next_steps?.map((step: any, index: number) => (
                <li key={index}>
                  <strong>{step.step}:</strong> {step.description}
                  {step.deadline && <span className="deadline"> (Due: {new Date(step.deadline).toLocaleDateString()})</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="actions">
            <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <h1>Commercial Account Setup</h1>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>
        <p>Step {step} of 4</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="onboarding-form">
        {step === 1 && (
          <div className="form-step">
            <h2>Organization Information</h2>
            
            <div className="form-group">
              <label htmlFor="org-name">Organization Name</label>
              <input
                id="org-name"
                type="text"
                {...register('organization.name')}
                className={errors.organization?.name ? 'error' : ''}
              />
              {errors.organization?.name && (
                <span className="error-message">{errors.organization.name.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="org-type">Organization Type</label>
                <select id="org-type" {...register('organization.type')}>
                  <option value="property_management">Property Management</option>
                  <option value="commercial_real_estate">Commercial Real Estate</option>
                  <option value="law_firm">Law Firm</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="org-size">Organization Size</label>
                <select id="org-size" {...register('organization.size')}>
                  <option value="small">Small (1-10 employees)</option>
                  <option value="medium">Medium (11-100 employees)</option>
                  <option value="large">Large (101-1000 employees)</option>
                  <option value="enterprise">Enterprise (1000+ employees)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="org-street">Street Address</label>
              <input
                id="org-street"
                type="text"
                {...register('organization.address.street')}
                className={errors.organization?.address?.street ? 'error' : ''}
              />
              {errors.organization?.address?.street && (
                <span className="error-message">{errors.organization.address.street.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="org-city">City</label>
                <input
                  id="org-city"
                  type="text"
                  {...register('organization.address.city')}
                  className={errors.organization?.address?.city ? 'error' : ''}
                />
                {errors.organization?.address?.city && (
                  <span className="error-message">{errors.organization.address.city.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="org-state">State</label>
                <input
                  id="org-state"
                  type="text"
                  {...register('organization.address.state')}
                  className={errors.organization?.address?.state ? 'error' : ''}
                />
                {errors.organization?.address?.state && (
                  <span className="error-message">{errors.organization.address.state.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="org-zip">ZIP Code</label>
                <input
                  id="org-zip"
                  type="text"
                  {...register('organization.address.zip')}
                  className={errors.organization?.address?.zip ? 'error' : ''}
                />
                {errors.organization?.address?.zip && (
                  <span className="error-message">{errors.organization.address.zip.message}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="org-phone">Phone</label>
                <input
                  id="org-phone"
                  type="tel"
                  {...register('organization.phone')}
                  className={errors.organization?.phone ? 'error' : ''}
                />
                {errors.organization?.phone && (
                  <span className="error-message">{errors.organization.phone.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="org-website">Website (optional)</label>
                <input
                  id="org-website"
                  type="url"
                  {...register('organization.website')}
                  className={errors.organization?.website ? 'error' : ''}
                />
                {errors.organization?.website && (
                  <span className="error-message">{errors.organization.website.message}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setStep(2)} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>Primary Contact</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact-first">First Name</label>
                <input
                  id="contact-first"
                  type="text"
                  {...register('primary_contact.first_name')}
                  className={errors.primary_contact?.first_name ? 'error' : ''}
                />
                {errors.primary_contact?.first_name && (
                  <span className="error-message">{errors.primary_contact.first_name.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact-last">Last Name</label>
                <input
                  id="contact-last"
                  type="text"
                  {...register('primary_contact.last_name')}
                  className={errors.primary_contact?.last_name ? 'error' : ''}
                />
                {errors.primary_contact?.last_name && (
                  <span className="error-message">{errors.primary_contact.last_name.message}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                type="email"
                {...register('primary_contact.email')}
                className={errors.primary_contact?.email ? 'error' : ''}
              />
              {errors.primary_contact?.email && (
                <span className="error-message">{errors.primary_contact.email.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact-phone">Phone</label>
                <input
                  id="contact-phone"
                  type="tel"
                  {...register('primary_contact.phone')}
                  className={errors.primary_contact?.phone ? 'error' : ''}
                />
                {errors.primary_contact?.phone && (
                  <span className="error-message">{errors.primary_contact.phone.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact-title">Title</label>
                <input
                  id="contact-title"
                  type="text"
                  {...register('primary_contact.title')}
                  className={errors.primary_contact?.title ? 'error' : ''}
                />
                {errors.primary_contact?.title && (
                  <span className="error-message">{errors.primary_contact.title.message}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2>Jurisdictions & Volume</h2>
            
            <div className="form-group">
              <label>Select Jurisdictions</label>
              <div className="jurisdiction-list">
                {availableJurisdictions.map(jurisdiction => (
                  <div
                    key={jurisdiction.id}
                    className={`jurisdiction-item ${selectedJurisdictions.includes(jurisdiction.id) ? 'selected' : ''}`}
                    onClick={() => toggleJurisdiction(jurisdiction.id)}
                  >
                    <span className="jurisdiction-name">{jurisdiction.name}</span>
                    <span className="checkbox">
                      {selectedJurisdictions.includes(jurisdiction.id) ? '✓' : ''}
                    </span>
                  </div>
                ))}
              </div>
              {errors.jurisdictions && (
                <span className="error-message">{errors.jurisdictions.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="monthly-appeals">Expected Monthly Appeals</label>
              <input
                id="monthly-appeals"
                type="number"
                min="1"
                {...register('expected_monthly_appeals', { valueAsNumber: true })}
                className={errors.expected_monthly_appeals ? 'error' : ''}
              />
              {errors.expected_monthly_appeals && (
                <span className="error-message">{errors.expected_monthly_appeals.message}</span>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                Back
              </button>
              <button type="button" onClick={() => setStep(4)} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="form-step">
            <h2>Integration Preferences</h2>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register('integration_preferences.api_access')}
                />
                <span>API Access Required</span>
                <small>Enable programmatic access to CHARLY APIs</small>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register('integration_preferences.sso_required')}
                />
                <span>Single Sign-On (SSO)</span>
                <small>Integrate with your existing authentication system</small>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register('integration_preferences.white_label')}
                />
                <span>White-Label Branding</span>
                <small>Customize the interface with your branding</small>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="webhook-url">Webhook URL (optional)</label>
              <input
                id="webhook-url"
                type="url"
                {...register('integration_preferences.webhook_url')}
                placeholder="https://your-domain.com/webhooks/charly"
                className={errors.integration_preferences?.webhook_url ? 'error' : ''}
              />
              {errors.integration_preferences?.webhook_url && (
                <span className="error-message">{errors.integration_preferences.webhook_url.message}</span>
              )}
              <small>Receive real-time notifications about appeal status changes</small>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setStep(3)} className="btn-secondary">
                Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}