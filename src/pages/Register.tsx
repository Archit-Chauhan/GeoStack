import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useRegister } from '@/features/auth/useAuth';
import { apiMessage } from '@/lib/api';
import { Button } from '@/components/ui';

export default function Register() {
  const navigate = useNavigate();
  const status = useAppSelector((s) => s.auth.status);
  const register = useRegister();

  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiMessage(err, 'Could not create your company'));
    }
  };

  return (
    <main className="auth">
      <section className="brand-panel">
        <div className="brand-wordmark">
          <span className="glyph">◆</span>
          <span>
            Geo<span className="yellow">Stock</span>
          </span>
        </div>

        <div className="brand-hero">
          <div className="tag" style={{ display: 'inline-block', marginBottom: 20 }}>
            START IN MINUTES
          </div>
          <h1>Bring your whole supply chain online.</h1>
          <p>
            Spin up a workspace for your company, invite your team, and start orchestrating stock
            across every location.
          </p>

          <div className="brand-motif">
            <span className="node-dot on" />
            <span className="wire live" />
            <span className="node-dot on" />
            <span className="wire live" />
            <span className="node-dot on" />
          </div>
        </div>

        <div className="trust-row">
          <div className="trust-badge">
            <span className="big num">Free</span>
            <span className="lbl">
              plan to
              <br />
              get started
            </span>
          </div>
          <div className="trust-badge">
            <span className="big num">9</span>
            <span className="lbl">
              roles for
              <br />
              your team
            </span>
          </div>
        </div>
      </section>

      <section className="auth-form">
        <div className="auth-card">
          <h2>Create your company</h2>
          <p className="lead">You'll be the owner of this GeoStock workspace.</p>

          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="companyName">Company name</label>
              <input
                className="input"
                id="companyName"
                placeholder="Northwind Supply Co."
                value={form.companyName}
                onChange={set('companyName')}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input
                className="input"
                id="name"
                placeholder="Archit Chauhan"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                className="input"
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set('password')}
                minLength={8}
                required
              />
            </div>

            {error ? <div className="form-error">{error}</div> : null}

            <Button type="submit" block loading={register.isPending}>
              Create workspace
            </Button>
          </form>

          <p className="auth-foot" style={{ marginTop: 24 }}>
            Already have an account?{' '}
            <Link className="link" to="/login">
              Sign in →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
