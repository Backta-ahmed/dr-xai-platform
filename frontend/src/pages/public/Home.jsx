import React from "react";
import { Link } from "react-router-dom";
import { Eye, FileCheck2, Layers, ShieldCheck } from "lucide-react";

import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants";

/**
 * Public entry point.
 *
 * Restrained on purpose. This is the front door of a clinical tool, not a
 * product launch — the two things a visitor needs are a way in and a way to
 * apply. No testimonials, no metrics we cannot substantiate, and no claim about
 * diagnostic performance while the platform runs a stub backend.
 */
const CAPABILITIES = [
  {
    icon: Eye,
    title: "Fundus review",
    body: "Upload a retinal image and read it at full resolution, with zoom and pan built for examining lesion detail rather than previewing a thumbnail.",
  },
  {
    icon: Layers,
    title: "Lesion overlays",
    body: "Segmentation masks and explanation layers register over the same viewport as the image, so model output can be checked against the pixels it came from.",
  },
  {
    icon: FileCheck2,
    title: "Patient records",
    body: "Each diagnosis is retained against its patient with its image, grade and provenance, and exports as a signed-off PDF report.",
  },
  {
    icon: ShieldCheck,
    title: "Access control",
    body: "Records are visible only to the clinician who created them. Every access is written to an audit log.",
  },
];

const Home = () => (
  <div className="min-h-screen bg-sand">
    <header className="border-b border-cyprus/10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5 text-cyprus">
          <Eye size={24} aria-hidden="true" />
          <span className="text-md font-semibold tracking-tight">DR-XAI Platform</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={ROUTES.REQUEST_ACCESS}>
            <Button variant="secondary" size="md">
              Request access
            </Button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary" size="md">
              Sign in
            </Button>
          </Link>
        </div>
      </nav>
    </header>

    <main className="mx-auto max-w-6xl px-5">
      <section className="grid grid-cols-1 gap-10 py-14 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            For ophthalmologists
          </p>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-cyprus sm:text-[2.25rem] sm:leading-[1.15]">
            Diabetic retinopathy screening support, built to be checked.
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-gray-700">
            A reading environment for retinal fundus images that keeps the image
            first and the model second. Grades, lesion segmentation and
            explanation layers are presented as evidence you verify against the
            scan — not as a verdict to accept.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={ROUTES.REQUEST_ACCESS}>
              <Button variant="primary" size="lg">
                Request clinician access
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button variant="secondary" size="lg">
                Sign in
              </Button>
            </Link>
          </div>

          <p className="mt-5 max-w-prose text-sm leading-relaxed text-gray-700">
            Access is restricted to qualified ophthalmologists and granted only
            after an administrator has verified your credentials.
          </p>
        </div>

        {/* Stated plainly rather than buried in a footnote. A visitor deciding
            whether to apply should know the platform is not yet diagnostic. */}
        <aside className="lg:col-span-5">
          <div className="rounded-card border-2 border-warning/40 bg-warning-wash p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-warning-ink">
              Current status — research instrument
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-warning-ink/90">
              No diagnostic model is connected to this platform yet. Results
              produced today are clearly marked as simulated, in the interface and
              on every exported report, and must not inform patient care.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-warning-ink/90">
              The classification, segmentation and explanation pipeline is in
              development. This deployment exists so the clinical workflow can be
              reviewed before that work lands.
            </p>
          </div>
        </aside>
      </section>

      <section className="border-t border-cyprus/10 py-12">
        <h2 className="text-lg font-semibold tracking-tight text-cyprus">
          What the platform does
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          {CAPABILITIES.map(({ icon, title, body }) => (
            <div key={title} className="flex gap-3.5">
              {/* createElement, not <Icon/>: the eslint config has no react
                  plugin, so JSX-only use of a destructured component is
                  reported as an unused variable. */}
              {React.createElement(icon, {
                size: 20,
                className: "mt-0.5 flex-shrink-0 text-accent",
                "aria-hidden": "true",
              })}
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-cyprus/10 py-12">
        <h2 className="text-lg font-semibold tracking-tight text-cyprus">
          Requesting access
        </h2>
        <ol className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            ["Submit your details", "Your name, contact email, and medical council registration number."],
            ["Attach proof of qualification", "Your medical licence or ophthalmology specialist certificate, as a PDF or a photograph."],
            ["Await verification", "An administrator checks your credentials against the register and contacts you by email."],
          ].map(([title, body], i) => (
            <li key={title} className="border-l-2 border-accent/30 pl-4">
              <span className="text-xs font-semibold tabular text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>

    <footer className="border-t border-cyprus/10 py-7">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 text-xs text-gray-600">
        <span>DR-XAI Platform — research instrument, not a medical device.</span>
        <span>Not for clinical use. Results are simulated until a validated model is connected.</span>
      </div>
    </footer>
  </div>
);

export default Home;
