import './globals.css';

export const metadata = {
  title: 'CHARLY — Residential',
  description: 'Property Tax Appeals for Homeowners'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <div className="topbar">
            <div className="brand">CHARLY</div>
            <div className="env">RESIDENTIAL</div>
          </div>
          <div className="main">
            <div className="rail">
              <a href="/">Home</a>
              <a href="/start">Start</a>
              <a href="/jurisdictions">Jurisdictions</a>
              <a href="/settings">Settings</a>
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