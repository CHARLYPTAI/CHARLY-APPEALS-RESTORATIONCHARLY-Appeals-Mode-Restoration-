'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const propertySchema = z.object({
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zip: z.string().min(5, 'ZIP code is required')
  }),
  property_type: z.enum(['single_family', 'condo', 'townhouse', 'multi_family']),
  year_built: z.number().min(1800, 'Year must be valid').max(new Date().getFullYear()),
  square_feet: z.number().min(100, 'Square feet must be valid'),
  lot_size: z.number().optional(),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  current_assessment: z.number().min(1, 'Current assessment is required'),
  estimated_value: z.number().min(1, 'Estimated value is required'),
  owner: z.object({
    name: z.string().min(1, 'Owner name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Phone number is required')
  })
});

type PropertyForm = z.infer<typeof propertySchema>;

export default function StartPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_type: 'single_family',
      bedrooms: 3,
      bathrooms: 2
    }
  });

  const onSubmit = async (data: PropertyForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/validate/residential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ property: data })
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const result = await response.json();
      setValidationResult(result);
      setStep(4);
    } catch (error) {
      console.error('Validation error:', error);
      alert('Property validation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 4 && validationResult) {
    return (
      <div className="start-success">
        <div className="card">
          <h1>Property Analysis Complete!</h1>
          <p>We've analyzed your property and determined the best course of action.</p>
          
          <div className="result-summary">
            <div className="workfile-id">
              <label>Workfile ID:</label>
              <code>{validationResult.workfile_id}</code>
            </div>
            
            {validationResult.decision_preview && (
              <div className="decision-preview">
                <div className={`decision-badge ${validationResult.decision_preview.label.toLowerCase()}`}>
                  {validationResult.decision_preview.label}
                </div>
                <div className="confidence">
                  Confidence: {Math.round(validationResult.decision_preview.confidence * 100)}%
                </div>
                {validationResult.decision_preview.savings_estimate > 0 && (
                  <div className="savings">
                    Potential Savings: ${validationResult.decision_preview.savings_estimate.toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {validationResult.errors && validationResult.errors.length > 0 && (
              <div className="errors">
                <h3>Issues Found:</h3>
                <ul>
                  {validationResult.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="next-actions">
            <h3>What's Next?</h3>
            <p>Based on your property analysis, here are your recommended next steps:</p>
            <div className="action-buttons">
              <a href="/reports" className="btn-primary">Generate Appeal Packet</a>
              <a href="/jurisdictions" className="btn-secondary">View Jurisdiction Info</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="start-container">
      <div className="start-header">
        <h1>Instant Property Tax Check</h1>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>
        <p>Step {step} of 3 - Tell us about your property</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="start-form">
        {step === 1 && (
          <div className="form-step">
            <h2>Property Address</h2>
            
            <div className="form-group">
              <label htmlFor="street">Street Address</label>
              <input
                id="street"
                type="text"
                placeholder="123 Main Street"
                {...register('address.street')}
                className={errors.address?.street ? 'error' : ''}
              />
              {errors.address?.street && (
                <span className="error-message">{errors.address.street.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  placeholder="Your City"
                  {...register('address.city')}
                  className={errors.address?.city ? 'error' : ''}
                />
                {errors.address?.city && (
                  <span className="error-message">{errors.address.city.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  type="text"
                  placeholder="TX"
                  maxLength={2}
                  {...register('address.state')}
                  className={errors.address?.state ? 'error' : ''}
                />
                {errors.address?.state && (
                  <span className="error-message">{errors.address.state.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="zip">ZIP Code</label>
                <input
                  id="zip"
                  type="text"
                  placeholder="12345"
                  {...register('address.zip')}
                  className={errors.address?.zip ? 'error' : ''}
                />
                {errors.address?.zip && (
                  <span className="error-message">{errors.address.zip.message}</span>
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
            <h2>Property Details</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="property-type">Property Type</label>
                <select id="property-type" {...register('property_type')}>
                  <option value="single_family">Single Family Home</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi_family">Multi-Family</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="year-built">Year Built</label>
                <input
                  id="year-built"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  {...register('year_built', { valueAsNumber: true })}
                  className={errors.year_built ? 'error' : ''}
                />
                {errors.year_built && (
                  <span className="error-message">{errors.year_built.message}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="square-feet">Square Feet</label>
                <input
                  id="square-feet"
                  type="number"
                  min="100"
                  {...register('square_feet', { valueAsNumber: true })}
                  className={errors.square_feet ? 'error' : ''}
                />
                {errors.square_feet && (
                  <span className="error-message">{errors.square_feet.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lot-size">Lot Size (sq ft, optional)</label>
                <input
                  id="lot-size"
                  type="number"
                  min="0"
                  {...register('lot_size', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bedrooms">Bedrooms</label>
                <input
                  id="bedrooms"
                  type="number"
                  min="0"
                  max="20"
                  {...register('bedrooms', { valueAsNumber: true })}
                  className={errors.bedrooms ? 'error' : ''}
                />
                {errors.bedrooms && (
                  <span className="error-message">{errors.bedrooms.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="bathrooms">Bathrooms</label>
                <input
                  id="bathrooms"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  {...register('bathrooms', { valueAsNumber: true })}
                  className={errors.bathrooms ? 'error' : ''}
                />
                {errors.bathrooms && (
                  <span className="error-message">{errors.bathrooms.message}</span>
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
            <h2>Assessment & Contact</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="current-assessment">Current Tax Assessment</label>
                <input
                  id="current-assessment"
                  type="number"
                  min="1"
                  placeholder="250000"
                  {...register('current_assessment', { valueAsNumber: true })}
                  className={errors.current_assessment ? 'error' : ''}
                />
                {errors.current_assessment && (
                  <span className="error-message">{errors.current_assessment.message}</span>
                )}
                <small>From your most recent property tax statement</small>
              </div>

              <div className="form-group">
                <label htmlFor="estimated-value">Estimated Market Value</label>
                <input
                  id="estimated-value"
                  type="number"
                  min="1"
                  placeholder="300000"
                  {...register('estimated_value', { valueAsNumber: true })}
                  className={errors.estimated_value ? 'error' : ''}
                />
                {errors.estimated_value && (
                  <span className="error-message">{errors.estimated_value.message}</span>
                )}
                <small>Your best estimate of current market value</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="owner-name">Owner Name</label>
              <input
                id="owner-name"
                type="text"
                placeholder="John Doe"
                {...register('owner.name')}
                className={errors.owner?.name ? 'error' : ''}
              />
              {errors.owner?.name && (
                <span className="error-message">{errors.owner.name.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="owner-email">Email</label>
                <input
                  id="owner-email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('owner.email')}
                  className={errors.owner?.email ? 'error' : ''}
                />
                {errors.owner?.email && (
                  <span className="error-message">{errors.owner.email.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="owner-phone">Phone</label>
                <input
                  id="owner-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('owner.phone')}
                  className={errors.owner?.phone ? 'error' : ''}
                />
                {errors.owner?.phone && (
                  <span className="error-message">{errors.owner.phone.message}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Analyzing Property...' : 'Get Instant Analysis'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}