import React from 'react';

export function V2Demo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-display-large font-bold text-neutral-900">
            🍎 CHARLY 2.0 Design System
          </h1>
          <p className="text-body-large text-text-secondary max-w-2xl mx-auto">
            Experience the revolutionary interface implementing invisible excellence 
            through sophisticated simplicity and progressive disclosure.
          </p>
        </div>

        {/* Apple Quality Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Tax Savings', value: '$2.4M', color: 'success' },
            { label: 'Active Properties', value: '156', color: 'primary' },
            { label: 'Flagged Opportunities', value: '23', color: 'warning' },
            { label: 'Success Rate', value: '87%', color: 'success' },
          ].map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-apple-lg p-6 shadow-apple-lg hover:shadow-apple-xl hover:-translate-y-1 transition-all duration-300 ease-apple border border-neutral-200/50"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-apple bg-primary-50 text-primary-500 flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <p className="text-label-medium font-medium text-text-secondary uppercase tracking-wide">
                    {metric.label}
                  </p>
                  <p className="text-headline-large font-bold text-neutral-900">
                    {metric.value}
                  </p>
                  <p className="text-caption text-success-600">
                    ↗ +12% vs last month
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Typography Showcase */}
        <div className="bg-white rounded-apple-xl p-8 shadow-apple-lg">
          <h2 className="text-headline-medium font-semibold text-neutral-900 mb-6">
            Apple-Quality Typography Scale
          </h2>
          <div className="space-y-4">
            <div>
              <span className="text-caption text-text-secondary">Display Large:</span>
              <p className="text-display-large font-bold">Revolutionary Design</p>
            </div>
            <div>
              <span className="text-caption text-text-secondary">Headline Medium:</span>
              <p className="text-headline-medium font-semibold">Invisible Excellence</p>
            </div>
            <div>
              <span className="text-caption text-text-secondary">Body Large (Apple 17px):</span>
              <p className="text-body-large">
                Every interaction feels inevitable and professionally elevated through 
                sophisticated simplicity.
              </p>
            </div>
            <div>
              <span className="text-caption text-text-secondary">Caption:</span>
              <p className="text-caption text-text-secondary">
                Supporting information with proper hierarchy
              </p>
            </div>
          </div>
        </div>

        {/* Color System */}
        <div className="bg-white rounded-apple-xl p-8 shadow-apple-lg">
          <h2 className="text-headline-medium font-semibold text-neutral-900 mb-6">
            Apple Color System
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-primary-500 rounded-apple"></div>
              <p className="text-label-medium font-medium">Apple Blue</p>
              <p className="text-caption text-text-secondary">#007AFF</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-success-500 rounded-apple"></div>
              <p className="text-label-medium font-medium">Apple Green</p>
              <p className="text-caption text-text-secondary">#34C759</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-warning-500 rounded-apple"></div>
              <p className="text-label-medium font-medium">Apple Orange</p>
              <p className="text-caption text-text-secondary">#FF9500</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-danger-500 rounded-apple"></div>
              <p className="text-label-medium font-medium">Apple Red</p>
              <p className="text-caption text-text-secondary">#FF3B30</p>
            </div>
          </div>
        </div>

        {/* Interactive Elements */}
        <div className="bg-white rounded-apple-xl p-8 shadow-apple-lg">
          <h2 className="text-headline-medium font-semibold text-neutral-900 mb-6">
            Apple-Quality Interactions
          </h2>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-primary-500 text-white rounded-apple font-medium transition-all duration-300 ease-apple hover:bg-primary-600 hover:shadow-apple-lg hover:-translate-y-0.5 active:scale-[0.98]">
                Primary Action
              </button>
              <button className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-apple font-medium transition-all duration-300 ease-apple hover:bg-neutral-200 hover:shadow-apple-md border border-neutral-200">
                Secondary Action
              </button>
              <button className="px-6 py-3 bg-success-500 text-white rounded-apple font-medium transition-all duration-300 ease-apple hover:bg-success-600 hover:shadow-apple-lg hover:-translate-y-0.5 active:scale-[0.98]">
                Success Action
              </button>
            </div>

            <div className="p-6 bg-neutral-50 rounded-apple-lg border border-neutral-200">
              <h3 className="text-title-medium font-semibold text-neutral-900 mb-3">
                Progressive Disclosure Example
              </h3>
              <p className="text-body-medium text-text-secondary mb-4">
                Content reveals itself naturally as users need it, creating an interface 
                that feels inevitable rather than overwhelming.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-apple border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition-colors duration-200 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-body-medium font-medium">Market Intelligence</span>
                    <span className="text-text-secondary">→</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-apple border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition-colors duration-200 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-body-medium font-medium">Property Analysis</span>
                    <span className="text-text-secondary">→</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-apple border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition-colors duration-200 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-body-medium font-medium">Appeals Generation</span>
                    <span className="text-text-secondary">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Design Philosophy */}
        <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-apple-2xl p-8">
          <h2 className="text-headline-medium font-semibold text-neutral-900 mb-6">
            Design Philosophy: Invisible Excellence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-white rounded-apple-lg flex items-center justify-center text-2xl mx-auto shadow-apple-md">
                ✨
              </div>
              <h3 className="text-title-medium font-semibold">Inevitable Simplicity</h3>
              <p className="text-body-small text-text-secondary">
                Every interaction feels like the only possible solution
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-white rounded-apple-lg flex items-center justify-center text-2xl mx-auto shadow-apple-md">
                🎯
              </div>
              <h3 className="text-title-medium font-semibold">Progressive Disclosure</h3>
              <p className="text-body-small text-text-secondary">
                Complexity reveals itself only when needed
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-white rounded-apple-lg flex items-center justify-center text-2xl mx-auto shadow-apple-md">
                🏆
              </div>
              <h3 className="text-title-medium font-semibold">Professional Elevation</h3>
              <p className="text-body-small text-text-secondary">
                Technology remains completely invisible to clients
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-body-large font-medium text-neutral-900 mb-2">
            🍎 Apple CTO Standards Applied
          </p>
          <p className="text-caption text-text-secondary">
            Excellence Through Invisible Technology
          </p>
        </div>
      </div>
    </div>
  );
}

export default V2Demo;