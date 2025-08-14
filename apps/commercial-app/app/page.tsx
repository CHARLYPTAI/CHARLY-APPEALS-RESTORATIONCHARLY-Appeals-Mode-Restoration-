export default function DashboardPage() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Commercial Dashboard</h1>
        <p>Welcome to CHARLY Commercial Property Tax Appeals</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Get Started</h3>
          <p>New to CHARLY? Complete your account setup to begin processing appeals.</p>
          <a href="/onboarding" className="btn-primary">Start Onboarding</a>
        </div>

        <div className="card">
          <h3>Portfolio Upload</h3>
          <p>Upload property data files to begin the assessment process.</p>
          <a href="/portfolio" className="btn-secondary">Upload Files</a>
        </div>

        <div className="card">
          <h3>Jurisdictions</h3>
          <p>View and configure jurisdiction-specific rules and deadlines.</p>
          <a href="/jurisdictions" className="btn-secondary">View Jurisdictions</a>
        </div>
      </div>
    </div>
  );
}