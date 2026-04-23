import React, { useState } from "react";
import "./App.css";

const App: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="page">
      <div className="container">
        {/* Left: Form */}
        <div className="left-panel">
          <div className="form-header">
            <h2>Sign in</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrap">
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
            </div>

            <div className="form-options">
              <a href="#" className="forgot">Forgot password?</a>
            </div>

            <button type="submit" className="btn-login">
              Sign In to Dashboard
            </button>
          </form>

          <p className="signup-link">
            No account yet? <a href="#">Request access</a>
          </p>
        </div>

        {/* Right: Visual */}
        <div className="right-panel">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 8L10.89 13.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke="#2F2504"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="brand-name">
              trott <span>mail</span>
            </span>
          </div>

          <div className="right-copy">
            <h1>
              Welcome<br />back.
            </h1>
          </div>

          <div className="right-footer">
            <div className="dot active" />
            <div className="dot" />
            <div className="dot" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;