import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleTheme } from '@/app/uiSlice';
import { useLogin } from '@/features/auth/useAuth';
import { apiMessage } from '@/lib/api';
import { Button } from '@/components/ui';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((s) => s.auth.status);
  const theme = useAppSelector((s) => s.ui.theme);
  const login = useLogin();

  const [email, setEmail] = useState('owner@northwind.co');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiMessage(err, 'Invalid email or password'));
    }
  };

  return (
    <main className="auth">
      {/* Brand panel — deliberately always dark */}
      <section className="brand-panel">
        <div className="brand-wordmark">
          <span className="glyph">◆</span>
          <span>
            Geo<span className="yellow">Stock</span>
          </span>
        </div>

        <div className="brand-hero">
          <div className="tag" style={{ display: 'inline-block', marginBottom: 20 }}>
            SUPPLY CHAIN COMMAND
          </div>
          <h1>Run your entire network from one map.</h1>
          <p>
            Warehouses, stores, inventory and transfers — live, on a single command view. Move stock
            with confidence.
          </p>

          <div className="brand-motif">
            <span className="node-dot on" />
            <span className="wire live" />
            <span className="node-dot on" />
            <span className="wire" />
            <span className="node-dot" />
          </div>
        </div>

        <div>
          <div className="trust-row">
            <div className="trust-badge">
              <span className="big num">12</span>
              <span className="lbl">
                Warehouses
                <br />
                orchestrated
              </span>
            </div>
            <div className="trust-badge">
              <span className="big num">48,210</span>
              <span className="lbl">
                SKUs tracked
                <br />
                in real time
              </span>
            </div>
            <div className="trust-badge">
              <span className="big num">99.98%</span>
              <span className="lbl">
                Transfer
                <br />
                accuracy
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Auth form — follows theme */}
      <section className="auth-form">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="lead">Sign in to your GeoStock workspace.</p>

          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                className="input"
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="pw">Password</label>
              <div className="input-wrap">
                <input
                  className="input"
                  id="pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="eye" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? 'HIDE' : 'SHOW'}
                </span>
              </div>
            </div>

            {error ? <div className="form-error">{error}</div> : null}

            <div className="field-row">
              <label className="check">
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <Link className="link" to="/register">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" block loading={login.isPending}>
              Sign in
            </Button>
          </form>

          <div className="divider">or</div>

          <Button variant="secondary" block onClick={() => navigate('/register')}>
            <span className="glyph" style={{ color: 'var(--primary)' }}>
              ◆
            </span>{' '}
            Register a new company
          </Button>

          <p className="auth-foot">
            New here?{' '}
            <Link className="link" to="/register">
              Register your company →
            </Link>
          </p>

          <p className="auth-foot" style={{ marginTop: 14 }}>
            <button className="btn--ghost" onClick={() => dispatch(toggleTheme())} style={{ fontSize: 12 }}>
              Toggle {theme === 'dark' ? '☾' : '☀'} theme
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
