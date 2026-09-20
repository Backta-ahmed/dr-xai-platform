import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Eye } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants";
import { errorMessage } from "../../api/axios";

// The entrance here is CSS (`.animate-auth-rise` in index.css), not a tween.
//
// The GSAP version it replaced animated `from: { opacity: 0 }`, which parks
// the element invisible and depends on the tween completing to reveal it.
// Under React StrictMode's double-invoked effects the context revert could
// leave the card stuck at zero opacity — the sign-in form was observed
// rendering fully invisible while present in the DOM, with no error to debug
// from. On the one screen every user passes through every shift, a decorative
// animation that can lock them out is a bad trade.
//
// A keyframe cannot fail that way: the browser runs it regardless of what
// JavaScript does, and its resting state is the visible one. Anything added
// here later must keep that property.
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
    <div className="flex min-h-screen flex-col justify-center bg-sand px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-auth-rise mx-auto w-full max-w-md">
        {/* The product is "DR-XAI Platform" on the marketing site and in the
            browser title. This screen called it "DR Diagnosis System" and the
            sidebar called it "DR Platform" — three names for one product, one
            of them on the page a paying clinician sees first. */}
        <Link
          to={ROUTES.HOME}
          className="flex flex-col items-center rounded-card text-cyprus focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <Eye size={44} strokeWidth={1.5} aria-hidden="true" />
          {/* Was text-3xl font-extrabold — the only extrabold in the codebase,
              and a step the type scale does not define. text-2xl is the top. */}
          <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight text-gray-900">
            DR-XAI Platform
          </h1>
        </Link>
        <p className="mt-1.5 text-center text-sm text-gray-600">
          Sign in to your clinical account
        </p>
      </div>

      <div className="animate-auth-rise-delayed mx-auto mt-6 w-full max-w-md">
        <div className="rounded-card border border-gray-100 bg-white px-5 py-8 shadow-card sm:px-10">
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

          {/* This screen was a dead end. A clinician who reached it without an
              account had no route to the application form the platform is
              gated behind, and one who was locked out had nothing at all —
              there is no self-service reset, so say who to ask. */}
          <div className="mt-6 border-t border-gray-100 pt-5 text-center text-sm">
            <p className="text-gray-600">
              No account yet?{" "}
              <Link
                to={ROUTES.REQUEST_ACCESS}
                className="rounded-sm font-medium text-accent underline-offset-2 hover:underline"
              >
                Request clinical access
              </Link>
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Locked out? Your platform administrator can reset your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
