import './globals.css';

export const metadata = {
  title: 'CHARLY — Commercial',
  description: 'Property Tax Appeals for Portfolios'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <div className="topbar">
            <div className="brand">CHARLY</div>
            <div className="env">COMMERCIAL</div>
          </div>
          <div className="main">
            <div className="rail">
              <a href="/">Dashboard</a>
              <a href="/portfolio">Portfolio</a>
              <a href="/onboarding">Onboarding</a>
              <a href="/jurisdictions">Jurisdictions</a>
              <a href="/admin">Admin</a>
            </div>
            <div className="content">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}