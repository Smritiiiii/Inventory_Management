import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .r {
    font-family: 'Geist', sans-serif;
    min-height: 100vh;
    background: #F5F2ED;
    color: #1a1a1a;
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: relative;
    overflow: hidden;
  }

  /* ── LEFT ── */
  .l {
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #EDE9E2;
    position: relative;
    overflow: hidden;
    border-right: 1px solid #DDD9D2;
  }

  /* red accent strip */
  .l-accent {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 3px;
    background: #c0392b;
  }

  /* Ghost — vertical spine text */
  .l-ghost {
    position: absolute;
    bottom: 2.5rem;
    left: -3.5rem;
    font-family: 'Instrument Serif', serif;
    font-size: 2.1rem;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1px #C8C3BB;
    pointer-events: none;
    user-select: none;
    letter-spacing: .22em;
    text-transform: uppercase;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-style: italic;
  }

  .l-logo { display: flex; align-items: center; gap: .65rem; z-index: 1; position: relative; }
  .l-logo-mark {
    width: 28px; height: 28px;
    background: #1a1a1a;
    border-radius: 5px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3.5px;
    padding: 6px;
  }
  .l-logo-mark span { display: block; background: #F5F2ED; border-radius: 1px; }
  .l-logo-name { font-size: .7rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: #6b6560; }

  .l-center { z-index: 1; position: relative; }
  .l-headline {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(3rem, 5vw, 4.5rem);
    line-height: .93;
    letter-spacing: -.03em;
    color: #1a1a1a;
    margin-bottom: 1.25rem;
  }
  .l-headline em { font-style: italic; color: #c0392b; }
  .l-tagline { font-size: .82rem; font-weight: 300; color: #7a7570; line-height: 1.65; max-width: 240px; }

  .l-bottom { z-index: 1; position: relative; }
  .l-rule { height: 1px; background: #D0CBC3; margin-bottom: 1.25rem; }
  .l-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
  .l-item label { display: block; font-size: .58rem; letter-spacing: .13em; text-transform: uppercase; color: #9C9388; margin-bottom: .22rem; }
  .l-item span { font-size: .78rem; color: #3d3a36; font-weight: 300; }

  /* ── RIGHT ── */
  .r-right {
    padding: 3rem 4rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .r-tabs {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #DDD9D2;
    padding-bottom: 0;
  }

  .r-tab {
    padding: 0.75rem 0;
    cursor: pointer;
    font-size: .8rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #B0AA9F;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: color .15s, border-color .15s;
  }

  .r-tab.active {
    color: #c0392b;
    border-bottom-color: #c0392b;
  }

  .r-tab:hover {
    color: #8a8580;
  }

  .r-step {
    display: flex; align-items: center; gap: .6rem;
    margin-bottom: 2.25rem;
  }
  .r-step-label { font-size: .6rem; letter-spacing: .15em; text-transform: uppercase; color: #B0AA9F; font-weight: 400; }
  .r-step-line { flex: 1; height: 1px; background: #DDD9D2; }

  .r-title {
    font-family: 'Instrument Serif', serif;
    font-size: 2.2rem;
    line-height: 1.08;
    letter-spacing: -.02em;
    color: #1a1a1a;
    margin-bottom: 2.5rem;
  }
  .r-title span { font-style: italic; color: #c0392b; }

  .r-field { margin-bottom: 1.65rem; }
  .r-label { font-size: .6rem; letter-spacing: .13em; text-transform: uppercase; color: #8a8580; font-weight: 500; display: block; margin-bottom: .5rem; }
  .r-input {
    width: 100%;
    background: #EFECE6;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: .75rem 1rem;
    font-family: 'Geist', sans-serif;
    font-size: .9rem; font-weight: 300;
    color: #1a1a1a; outline: none;
    transition: border-color .15s, background .15s;
  }
  .r-input::placeholder { color: #B8B3AA; }
  .r-input:focus { background: #fff; border-color: #c0392b; }
  .r-input:disabled { opacity: .4; cursor: not-allowed; }

  .r-checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.65rem 0;
  }

  .r-checkbox {
    width: 20px;
    height: 20px;
    accent-color: #c0392b;
    cursor: pointer;
  }

  .r-checkbox-label {
    font-size: .75rem;
    letter-spacing: .05em;
    color: #6b6560;
    font-weight: 400;
    cursor: pointer;
    user-select: none;
  }

  .r-error {
    font-size: .74rem; color: #c0392b; font-weight: 400;
    padding: .6rem .9rem; background: #fdf0ee;
    border-left: 2px solid #c0392b; border-radius: 0 4px 4px 0;
    margin-bottom: 1.25rem;
  }
  .r-success {
    font-size: .74rem; color: #4A7C59; padding: .6rem .9rem;
    background: #EEF5F0; border-left: 2px solid #4A7C59;
    border-radius: 0 4px 4px 0; margin-bottom: 1.25rem;
  }

  /* ── BUTTON ── */
  .r-btn {
    width: 100%; margin-top: .5rem;
    background: #c0392b;
    color: #fff;
    border: none; border-radius: 7px;
    padding: 1rem 1.4rem;
    font-family: 'Geist', sans-serif; font-size: .76rem;
    font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; display: flex; align-items: center; justify-content: space-between;
    transition: background .15s, transform .1s;
  }
  .r-btn:hover:not(:disabled) { background: #a93226; }
  .r-btn:active:not(:disabled) { transform: scale(.99); background: #922b21; }
  .r-btn:disabled { opacity: .5; cursor: not-allowed; }
  .r-btn-arrow { font-size: .95rem; transition: transform .2s; }
  .r-btn:hover:not(:disabled) .r-btn-arrow { transform: translateX(3px); }

  .r-spinner {
    width: 13px; height: 13px;
    border: 1.5px solid rgba(255,255,255,.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .r-foot {
    margin-top: 2rem;
    display: flex; align-items: center; gap: .5rem;
    font-size: .63rem; color: #B0AA9F; font-weight: 300;
  }
  .r-foot-dot { width: 3px; height: 3px; border-radius: 50%; background: #C8C3BB; }

  .r-divider {
    position: absolute;
    left: 50%; top: 0; bottom: 0;
    width: 1px;
    background: #DDD9D2;
    pointer-events: none;
  }
  .r-divider::before, .r-divider::after {
    content: '';
    position: absolute;
    left: -3px;
    width: 7px; height: 1px;
    background: #C8C3BB;
  }
  .r-divider::before { top: 56px; }
  .r-divider::after { bottom: 56px; }

  @media (max-width: 820px) {
    .r { grid-template-columns: 1fr; }
    .l { display: none; }
    .r-right { padding: 2.5rem 2rem; justify-content: flex-start; padding-top: 4rem; }
    .r-divider { display: none; }
  }
`;

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  
  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [regIsLoading, setRegIsLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    try {
      // Clear old tokens before login
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");

      const res = await api.post("/auth/login/", { username, password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegIsLoading(true);
    setRegError("");

    if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError("Please fill in all fields");
      setRegIsLoading(false);
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setRegError("Passwords do not match");
      setRegIsLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters long");
      setRegIsLoading(false);
      return;
    }

    try {
      // Clear old tokens before register
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");

      const res = await api.post("/auth/register/", {
        username: regUsername,
        email: regEmail,
        password: regPassword,
        password_confirm: regPasswordConfirm,
        is_admin: isAdmin,
      });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setRegSuccess(true);
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      const errorData = err.response?.data || {};
      if (typeof errorData === 'object') {
        const firstError = Object.values(errorData)[0];
        setRegError(Array.isArray(firstError) ? firstError[0] : firstError || "Registration failed");
      } else {
        setRegError("Registration failed");
      }
    } finally {
      setRegIsLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="r">
        <div className="r-divider" />

        {/* LEFT */}
        <div className="l">
          <div className="l-accent" />
          <div className="l-ghost">Contact</div>

          <div className="l-logo">
            <div className="l-logo-mark">
              <span /><span /><span /><span />
            </div>
            <span className="l-logo-name">Sai Shankar</span>
          </div>

          <div className="l-center">
            <h1 className="l-headline">
              Stock.<br /><em>Tracked.</em><br />Always.
            </h1>
            <p className="l-tagline">
              Inventory management for cylinders, suppliers &amp; daily sales.
            </p>
          </div>

          <div className="l-bottom">
            <div className="l-rule" />
            <div className="l-grid">
              <div className="l-item"><label>Phone</label><span>9860042977</span></div>
              <div className="l-item"><label>Alternate</label><span>9861922604</span></div>
              <div className="l-item"><label>Location</label><span>Sifal, Kathmandu</span></div>
              <div className="l-item"><label>Web</label><span>saishankar.com</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="r-right">
          <div className="r-step">
            <span className="r-step-label">
              {activeTab === "login" ? "Authentication" : "Create Account"}
            </span>
            <div className="r-step-line" />
          </div>

          {/* Tabs */}
          <div className="r-tabs">
            <div
              className={`r-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                setError("");
                setSuccess(false);
              }}
            >
              Sign In
            </div>
            <div
              className={`r-tab ${activeTab === "register" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("register");
                setRegError("");
                setRegSuccess(false);
              }}
            >
              Register
            </div>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <>
              <p className="r-title">
                Sign in to<br />your <span>workspace.</span>
              </p>

              {error && <div className="r-error">{error}</div>}
              {success && <div className="r-success">Authenticated — redirecting…</div>}

              <form onSubmit={handleLogin}>
                <div className="r-field">
                  <label className="r-label">Username</label>
                  <input
                    className="r-input"
                    type="text"
                    placeholder="enter username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    disabled={isLoading || success}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="r-field">
                  <label className="r-label">Password</label>
                  <input
                    className="r-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    disabled={isLoading || success}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="r-btn"
                  disabled={isLoading || success}
                >
                  {isLoading ? (
                    <><span>Signing in</span><div className="r-spinner" /></>
                  ) : success ? (
                    <><span>Authenticated</span><span>✓</span></>
                  ) : (
                    <><span>Sign In</span><span className="r-btn-arrow">→</span></>
                  )}
                </button>
              </form>

              <div className="r-foot">
                <span>Secured</span>
                <div className="r-foot-dot" />
                <span>Encrypted</span>
                <div className="r-foot-dot" />
                <span>Private</span>
              </div>
            </>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <>
              <p className="r-title">
                Create your<br /><span>account.</span>
              </p>

              {regError && <div className="r-error">{regError}</div>}
              {regSuccess && <div className="r-success">Account created — redirecting…</div>}

              <form onSubmit={handleRegister}>
                <div className="r-field">
                  <label className="r-label">Username</label>
                  <input
                    className="r-input"
                    type="text"
                    placeholder="choose a username"
                    value={regUsername}
                    onChange={(e) => {
                      setRegUsername(e.target.value);
                      setRegError("");
                    }}
                    disabled={regIsLoading || regSuccess}
                    required
                  />
                </div>

                <div className="r-field">
                  <label className="r-label">Email</label>
                  <input
                    className="r-input"
                    type="email"
                    placeholder="your@email.com"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      setRegError("");
                    }}
                    disabled={regIsLoading || regSuccess}
                    required
                  />
                </div>

                <div className="r-field">
                  <label className="r-label">Password</label>
                  <input
                    className="r-input"
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      setRegError("");
                    }}
                    disabled={regIsLoading || regSuccess}
                    required
                  />
                </div>

                <div className="r-field">
                  <label className="r-label">Confirm Password</label>
                  <input
                    className="r-input"
                    type="password"
                    placeholder="••••••••"
                    value={regPasswordConfirm}
                    onChange={(e) => {
                      setRegPasswordConfirm(e.target.value);
                      setRegError("");
                    }}
                    disabled={regIsLoading || regSuccess}
                    required
                  />
                </div>

                <div className="r-checkbox-group">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    className="r-checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    disabled={regIsLoading || regSuccess}
                  />
                  <label htmlFor="isAdmin" className="r-checkbox-label">
                    Register as Admin (full access to edit & delete records)
                  </label>
                </div>

                <button
                  type="submit"
                  className="r-btn"
                  disabled={regIsLoading || regSuccess}
                >
                  {regIsLoading ? (
                    <><span>Creating account</span><div className="r-spinner" /></>
                  ) : regSuccess ? (
                    <><span>Account Created</span><span>✓</span></>
                  ) : (
                    <><span>Register</span><span className="r-btn-arrow">→</span></>
                  )}
                </button>
              </form>

              <div className="r-foot">
                <span>Secured</span>
                <div className="r-foot-dot" />
                <span>Encrypted</span>
                <div className="r-foot-dot" />
                <span>Private</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}