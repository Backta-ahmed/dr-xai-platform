import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants";
import { errorMessage } from "../../api/axios";

// The GSAP entrance animation that used to live here has been removed.
//
// It animated `from: { opacity: 0 }`, which parks the element invisible and
// relies on the tween completing to reveal it. Under React StrictMode's
// double-invoked effects the context revert could leave the card stuck at zero
// opacity — the sign-in form was observed rendering fully invisible while
// present in the DOM. On the one screen every user must pass through every
// shift, a decorative animation that can lock them out is a bad trade.
//
// Anything added here later must animate *from a visible resting state*.
// The refs the tween targeted are gone too, so there is nothing here inviting
// it back.
const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === "admin" ? ROUTES.ADMIN : ROUTES.DASHBOARD} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      toast.success("Successfully logged in");
      if (loggedUser.role === "admin") {
        navigate(ROUTES.ADMIN);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error) {
      toast.error(errorMessage(error, "Could not sign in. Check your credentials."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-sand py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-cyprus">
          <Eye size={44} strokeWidth={1.5} aria-hidden="true" />
        </div>
        {/* Was text-3xl font-extrabold — the only extrabold in the codebase, and
            a step the type scale does not define. text-2xl is the scale's top. */}
        <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight text-gray-900">
          DR Diagnosis System
        </h1>
        <p className="mt-1.5 text-center text-sm text-gray-600">
          Sign in to your clinical account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border border-gray-100 bg-white px-4 py-8 shadow-card sm:rounded-card sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="Email address" required>
              {(p) => (
                <input
                  {...p}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>

            <Field label="Password" required>
              {(p) => (
                <input
                  {...p}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>

            <Button variant="primary" size="lg" type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
