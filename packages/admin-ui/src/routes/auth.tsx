import { authAtom } from '@/lib/state';
import { makeTreaty } from '@/lib/treaty';
import { createFileRoute } from '@tanstack/react-router'
import { useState, type ChangeEventHandler } from 'react';
import { useAtom } from "jotai";
import type { PublicUser, Token } from "server/db/schema";

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
})

async function signIn(username: string, password: string): Promise<Token | Error> {
  const treaty = makeTreaty();
  const { data, error } = await treaty.tokens.post({
    username,
    password,
  });

  if (error !== null) {
    return new Error(`Couldn't sign in: ${error.value}`);
  }

  return data;
}

async function signUp(username: string, password: string, joincode: string): Promise<string | Error> {
  const treaty = makeTreaty();
  const { data, error } = await treaty.users.post({
    username,
    password,
    joincode,
  });


  if (error !== null) {
    return new Error(`Couldn't sign up: ${error.value}`);
  }

  return data.id;
}

async function getUser(session: Token): Promise<PublicUser | Error> {
  const treaty = makeTreaty(session.token);
  const { data, error } = await treaty.users({ id: session.userId }).get();

  if (error !== null) {
    return new Error(`Couldn't get the user: ${error}`)
  }

  return data;
}


function RouteComponent() {
  const navigate = Route.useNavigate();
  const [mode, setMode] = useState('signin');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    joinKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [_, setAuth] = useAtom(authAtom);

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (mode === "signup") {
      const signupRes = await signUp(formData.username, formData.password, formData.joinKey);
      if (signupRes instanceof Error) {
        setError(signupRes.message);
        setLoading(false);
        return;
      }
    }
    const token = await signIn(formData.username, formData.password);
    if (token instanceof Error) {
      setError(token.message);
      return;
    }

    console.log(`Successful ${mode}: ${token}`);
    const user = await getUser(token);

    if (user instanceof Error) {
      setError(user.message);
      return;
    }

    setAuth({
      user,
      session: token,
    });
    navigate({
      to: "/",
    });
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setFormData({
      username: '',
      password: '',
      joinKey: ''
    });
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Inksync Admin</h1>
            <p className="text-base-content/70">
              {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="tabs tabs-boxed mb-6">
            <button
              className={`tab flex-1 ${mode === 'signin' ? 'tab-active' : ''}`}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              className={`tab flex-1 ${mode === 'signup' ? 'tab-active' : ''}`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Username */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  className="input input-bordered flex-1"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className="input input-bordered flex-1"
                  required
                />
              </div>
            </div>

            {/* Join Key (Sign Up only) */}
            {mode === 'signup' && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Join Key</span>
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    name="joinKey"
                    value={formData.joinKey}
                    onChange={handleInputChange}
                    placeholder="Enter join key"
                    className="input input-bordered flex-1"
                    required
                  />
                </div>
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Contact your admin for a join key
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <div className="form-control mt-6">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  await handleSubmit();
                  setLoading(false);
                }}
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? '' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>

          {/* Additional Options */}
          <div className="divider">OR</div>

          <div className="text-center">
            <p className="text-sm text-base-content/70">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              type="button"
              onClick={switchMode}
              className="btn btn-link btn-sm p-0 h-auto min-h-0"
            >
              {mode === 'signin' ? 'Sign up here' : 'Sign in here'}
            </button>
          </div>

          {mode === 'signin' && (
            <div className="text-center mt-4">
              <button className="btn btn-link btn-sm p-0 h-auto min-h-0">
                Forgot password?
              </button>
            </div>
          )}
          <p className="text-error">{error}</p>
        </div>
      </div>
    </div>
  );
}
