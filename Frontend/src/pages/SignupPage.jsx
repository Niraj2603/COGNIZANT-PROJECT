import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './LoginPage.module.css';

const SignupPage = ({ onSignup, onSwitchToLogin }) => {
  const { state } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      // TODO: Replace with your backend API endpoint
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role: userRole }),
      });
      const data = await response.json();
      if (response.ok) {
        onSignup(data);
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginContainer}>
        <div className={styles.loginLeft}>
          <div className={styles.loginBranding}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>⚡</div>
              <h1>IRENO</h1>
            </div>
            <h2>Smart Assistant</h2>
            <p>-Style AI for Electric Utilities</p>
            <div className={styles.utilityBackground}>
              <div className={styles.gridLines}></div>
              <div className={styles.powerIndicators}>
                <div className={`${styles.indicator} ${styles.active}`}></div>
                <div className={`${styles.indicator} ${styles.active}`}></div>
                <div className={`${styles.indicator} ${styles.warning}`}></div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.loginRight}>
          <div className={styles.loginFormContainer}>
            <h3>Create Account</h3>
            <p>Sign up to access your AI-powered utility assistant</p>
            <form onSubmit={handleSubmit} className={styles.loginForm}>
              {error && <div className={styles.error}>{error}</div>}
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-control"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  required
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="userRole" className="form-label">Role</label>
                <select
                  id="userRole"
                  name="userRole"
                  className="form-control"
                  required
                  value={userRole}
                  onChange={e => setUserRole(e.target.value)}
                >
                  <option value="">Select your role</option>
                  {state.userRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn btn--primary btn--full-width"
                disabled={isLoading}
              >
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </button>
              <div className={styles.loginFooter}>
                <span>Already have an account? </span>
                <button type="button" onClick={onSwitchToLogin} className={styles.linkButton}>
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
