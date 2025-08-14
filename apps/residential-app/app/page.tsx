export default function HomePage() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Instant Property Tax Check</h1>
        <p>
          Get an instant analysis of your property tax assessment in minutes. 
          Find out if you're overpaying and get a professional appeal packet ready to file.
        </p>
        <div className="hero-cta">
          <a href="/start" className="btn-primary">Start Your Free Check</a>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <h3>Instant Analysis</h3>
          <p>Our AI-powered system analyzes your property in under 60 seconds and gives you a clear verdict on your assessment.</p>
        </div>

        <div className="feature">
          <h3>Professional Appeal Packet</h3>
          <p>If you're overpaying, we generate a complete, jurisdiction-specific appeal packet ready to file.</p>
        </div>

        <div className="feature">
          <h3>No Upfront Costs</h3>
          <p>Pay only if we find savings. Our success-based pricing means we only win when you win.</p>
        </div>
      </div>

      <div className="social-proof">
        <p>Trusted by thousands of homeowners across Texas, Illinois, and Arizona</p>
      </div>
    </div>
  );
}