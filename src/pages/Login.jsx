import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../lib/auth";
import { LogoMark } from "../components/Logo";
import { Alert, Button, Field, Input } from "../components/ui";
import { BRAND } from "../lib/brand";

export default function Login() {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/admin";

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setError("");
    setLoading(true);
    try {
      await login(password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <div className="px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-fg">
          <ArrowLeft size={14} />
          Check-in desk
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-[380px]">
          <div className="flex flex-col items-center text-center mb-8">
            <LogoMark className="w-11 h-11" />
            <h1 className="mt-5 text-xl font-semibold tracking-tight text-fg">Sign in to {BRAND.name}</h1>
            <p className="text-sm text-muted mt-1">Admin access for staff and visitor management</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-line rounded-xl shadow-card p-6 space-y-5"
          >
            {error && <Alert icon={AlertCircle}>{error}</Alert>}

            <Field label="Admin password" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md flex items-center justify-center text-subtle hover:text-fg"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!password}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-xs text-subtle mt-6">
            Sessions expire automatically. Sign out on shared devices.
          </p>
        </div>
      </div>
    </div>
  );
}
