// 🍎 Login Page - Apple Authentication Excellence
// Clean, secure, beautiful

import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { authService } from '../lib/auth';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const success = await authService.login(email, password);
      
      if (success) {
        onLoginSuccess();
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>CHARLY</h1>
          <p style={styles.tagline}>Property Tax Appeals Platform</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error && !email ? 'Email is required' : ''}
            autoComplete="email"
            autoFocus
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error && !password ? 'Password is required' : ''}
            autoComplete="current-password"
          />
          
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            style={styles.loginButton}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Demo credentials: demo@charly.com / demo123
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },

  card: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '16px',
    padding: SPACING.XXL,
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.08)',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XXL,
  },

  logo: {
    fontSize: '48px',
    fontWeight: 700,
    color: APPLE_COLORS.BLUE,
    margin: 0,
    marginBottom: SPACING.XS,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    letterSpacing: '-1px',
  },

  tagline: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    fontWeight: 500,
  },

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.LG,
  },

  loginButton: {
    width: '100%',
    marginTop: SPACING.SM,
  },

  errorMessage: {
    padding: SPACING.SM,
    backgroundColor: `${APPLE_COLORS.RED}10`,
    border: `1px solid ${APPLE_COLORS.RED}30`,
    borderRadius: '8px',
    color: APPLE_COLORS.RED,
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'center' as const,
  },

  footer: {
    marginTop: SPACING.XXL,
    paddingTop: SPACING.LG,
    borderTop: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    textAlign: 'center' as const,
  },

  footerText: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    fontFamily: 'Monaco, monospace',
  },
} as const;

export default Login;