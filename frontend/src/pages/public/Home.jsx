import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Check,
  Eye,
  FileCheck2,
  Layers,
  Lock,
  Microscope,
  ScanEye,
  ShieldCheck,
  Stethoscope,
  Upload,
} from "lucide-react";

import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants";

/**
 * Public entry point for a paid clinical service.
 *
 * Structure follows what comparable DR-screening products actually put on their
 * front page — how it works, who it is for, the evidence, the plans — but the
 * angle is different from theirs. Those products sell *automation* to primary
 * care: a verdict in ten seconds, no specialist needed. This one sells to the
 * specialist, so the differentiator is the opposite of automation. It is
 * inspectability: every claim the model makes can be checked against the pixels
 * it came from.
 *
 * Plans are shown because the service is commercial, but they are labelled as
 * not yet billable. No diagnostic model is connected, and charging for a
 * diagnostic service that returns placeholder output would be indefensible —
 * so the status panel stays above the fold until that changes.
 */

const STEPS = [
  {
    icon: Upload,
    title: "Upload",
    body: "Drop in a fundus photograph and record which eye it is. Accepts JPEG, PNG, TIFF, BMP and WEBP from any camera.",
  },
  {
    icon: ScanEye,
    title: "Analyse",
    body: "The pipeline grades the image, segments lesions, and produces an explanation of how it reached that grade.",
  },
  {
    icon: FileCheck2,
    title: "Verify and sign",
    body: "Read the overlays against the image, record your own assessment, and export a report carrying both.",
  },
];

const DIFFERENTIATORS = [
  {
    icon: Layers,
    title: "Inspectable, not a black box",
    body: "Lesion masks and explanation heatmaps register over the same viewport as the scan, at the same zoom. You check the model's evidence rather than taking its word.",
  },
  {
    icon: Microscope,
    title: "Built for the specialist",
    body: "No textbook definitions, no referral prompts, no simplified output. The interface assumes you read fundus images for a living.",
  },
  {
    icon: Activity,
    title: "Per-eye longitudinal record",
    body: "Every diagnosis is recorded against a patient and an eye, so a scan can be read against earlier scans of the same eye.",
  },
  {
    icon: Lock,
    title: "Records stay yours",
    body: "Patients and diagnoses are visible only to the clinician who created them. Images are served through authenticated routes, never public links, and every access is logged.",
  },
];

const AUDIENCES = [
  {
    icon: Stethoscope,
    title: "Individual ophthalmologists",
    body: "Screening clinics and private practice, where a second read shortens the queue without outsourcing the judgment.",
  },
  {
    icon: Eye,
    title: "Eye departments",
    body: "Shared patient records within a department, each clinician seeing their own list, with an administrator managing access.",
  },
  {
    icon: Microscope,
    title: "Research groups",
    body: "Reproducible grading with model provenance recorded per result, so a cohort can be re-read when the model changes.",
  },
];

const PLANS = [
  {
    name: "Practitioner",
    blurb: "A single ophthalmologist.",
    features: [
      "One clinician account",
      "Unlimited patients and scans",
      "Lesion and explanation overlays",
      "PDF reports",
      "Email support",
    ],
  },
  {
    name: "Clinic",
    blurb: "A department with an administrator.",
    featured: true,
    features: [
      "Up to 10 clinician accounts",
      "Everything in Practitioner",
      "Administrator console and access review",
      "Full audit log export",
      "Priority support",
    ],
  },
  {
    name: "Institution",
    blurb: "Hospitals and research groups.",
    features: [
      "Unlimited accounts",
      "Everything in Clinic",
      "Self-hosted or regional deployment",
      "Model provenance and cohort export",
      "Named technical contact",
    ],
  },
];

const FAQ = [
  [
    "Who can get an account?",
    "Qualified ophthalmologists. Every application is checked against a medical licence or specialist certificate before access is granted — there is no self-service sign-up.",
  ],
  [
    "Does it replace my reading?",
    "No, and it is not built to. The model is a second reader whose evidence you inspect. Your own assessment is recorded alongside its grade and appears on the exported report.",
  ],
  [
    "Which cameras does it work with?",
    "Any that exports a standard image file. There is no hardware dependency and nothing to install in the clinic.",
  ],
  [
    "Where is patient data stored?",
    "In an access-controlled database, with images in private storage served only through authenticated requests. Nothing is publicly addressable, and every record access is written to an audit log.",
  ],
];

const Section = ({ id, eyebrow, title, lead, children }) => (
  <section id={id} className="border-t border-cyprus/10 py-14">
    {eyebrow && (
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
    )}
    <h2 className="mt-2 text-lg font-semibold tracking-tight text-cyprus sm:text-xl">
      {title}
    </h2>
    {lead && <p className="mt-2 max-w-prose text-sm leading-relaxed text-gray-700">{lead}</p>}
    <div className="mt-7">{children}</div>
  </section>
);

const Home = () => (
  <div className="min-h-screen bg-sand">
    <header className="sticky top-0 z-20 border-b border-cyprus/10 bg-sand/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5 text-cyprus">
          <Eye size={22} aria-hidden="true" />
          <span className="text-md font-semibold tracking-tight">DR-XAI Platform</span>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          {[
            ["How it works", "#how"],
            ["Why it differs", "#why"],
            ["Plans", "#plans"],
            ["Questions", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm text-gray-700 transition-colors hover:text-cyprus"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to={ROUTES.LOGIN}>
            <Button variant="secondary" size="md">Sign in</Button>
          </Link>
          <Link to={ROUTES.REQUEST_ACCESS}>
            <Button variant="primary" size="md">Request access</Button>
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
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-cyprus sm:text-[2.35rem] sm:leading-[1.12]">
            A second reader for diabetic retinopathy that shows its working.
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-gray-700">
            Most screening tools hand you a grade and ask you to trust it. This one
            marks the lesions it found, on the image you are already looking at, so
            the grade is something you can check in seconds rather than accept.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={ROUTES.REQUEST_ACCESS}>
              <Button variant="primary" size="lg">Request clinician access</Button>
            </Link>
            <a href="#how">
              <Button variant="secondary" size="lg">See how it works</Button>
            </a>
          </div>

          <p className="mt-5 max-w-prose text-sm leading-relaxed text-gray-700">
            Access is restricted to qualified ophthalmologists and granted only after
            an administrator has verified your credentials.
          </p>
        </div>

        {/* Kept beside the headline rather than in a footnote. Someone deciding
            whether to apply should learn this before they scroll. */}
        <aside className="lg:col-span-5">
          <div className="rounded-card border-2 border-warning/40 bg-warning-wash p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-warning-ink">
              Early access — model in development
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-warning-ink/90">
              No diagnostic model is connected yet. Results produced today are
              randomly generated, marked as simulated everywhere they appear, and
              watermarked on every exported report. They must not inform patient care.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-warning-ink/90">
              The classification, segmentation and explanation pipeline is being
              built. Accounts are being granted now so the clinical workflow can be
              reviewed before it lands. <strong>Nothing is billable until it does.</strong>
            </p>
          </div>
        </aside>
      </section>

      <Section
        id="how"
        eyebrow="How it works"
        title="Three steps, and the third is the point"
        lead="The first two are what every screening tool does. The third is what this one is for."
      >
        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon, title, body }, i) => (
            <li key={title} className="rounded-card bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyprus text-xs font-bold text-white">
                  {i + 1}
                </span>
                {React.createElement(icon, {
                  size: 18,
                  className: "text-accent",
                  "aria-hidden": "true",
                })}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="why"
        eyebrow="Why it differs"
        title="Built to be checked, not believed"
        lead="Comparable products sell automation to primary care — a verdict in seconds, no specialist on site. This one sells to the specialist, so it optimises for the opposite property."
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          {DIFFERENTIATORS.map(({ icon, title, body }) => (
            <div key={title} className="flex gap-3.5">
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
      </Section>

      <Section id="who" eyebrow="Who it is for" title="Three ways it gets used">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {AUDIENCES.map(({ icon, title, body }) => (
            <div key={title} className="rounded-card border border-cyprus/15 bg-white p-5">
              {React.createElement(icon, {
                size: 20,
                className: "text-accent",
                "aria-hidden": "true",
              })}
              <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="evidence"
        eyebrow="Evidence"
        title="Performance figures are not published yet"
        lead="Comparable products lead with sensitivity and specificity. Those numbers will appear here, per lesion class and per grade, once the model is trained and evaluated on a held-out set — and not before."
      >
        <div className="rounded-card border border-dashed border-cyprus/30 bg-white/60 p-6">
          <p className="max-w-prose text-sm leading-relaxed text-gray-700">
            Every result the platform stores already records which model and which
            version produced it, so when figures do exist they can be tied to exactly
            the version that generated any given report — including, retrospectively,
            which results came from the current placeholder.
          </p>
        </div>
      </Section>

      <Section
        id="plans"
        eyebrow="Plans"
        title="Pricing, once there is something to charge for"
        lead="Shown so you know what the service will cost. No plan is billable while the model is in development, and early-access accounts are free until it ships."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-card p-6 ${
                plan.featured
                  ? "bg-cyprus text-white shadow-raised ring-2 ring-accent"
                  : "border border-cyprus/15 bg-white shadow-card"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3
                  className={`text-md font-semibold ${
                    plan.featured ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                {plan.featured && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-white">
                    Most asked for
                  </span>
                )}
              </div>
              <p
                className={`mt-1 text-sm ${
                  plan.featured ? "text-white/80" : "text-gray-600"
                }`}
              >
                {plan.blurb}
              </p>

              <p
                className={`mt-5 text-xl font-bold ${
                  plan.featured ? "text-white" : "text-cyprus"
                }`}
              >
                Free
                <span
                  className={`ml-2 text-xs font-medium ${
                    plan.featured ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  during early access
                </span>
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm">
                    <Check
                      size={15}
                      className={`mt-0.5 flex-shrink-0 ${
                        plan.featured ? "text-accent" : "text-success"
                      }`}
                      aria-hidden="true"
                    />
                    <span className={plan.featured ? "text-white/90" : "text-gray-700"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to={ROUTES.REQUEST_ACCESS} className="mt-6 block">
                <Button variant={plan.featured ? "accent" : "secondary"} fullWidth>
                  Request access
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section id="faq" eyebrow="Questions" title="Before you apply">
        <dl className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt className="text-sm font-semibold text-gray-900">{q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-gray-700">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <section className="border-t border-cyprus/10 py-14">
        <div className="flex flex-col items-start gap-5 rounded-card bg-cyprus p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Request clinician access
            </h2>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-white/80">
              Submit your registration number and proof of qualification. An
              administrator verifies your credentials before an account is created.
            </p>
          </div>
          <Link to={ROUTES.REQUEST_ACCESS} className="flex-shrink-0">
            <Button variant="accent" size="lg">Get started</Button>
          </Link>
        </div>
      </section>
    </main>

    <footer className="border-t border-cyprus/10 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 text-xs text-gray-600">
        <div className="flex items-center gap-2 text-cyprus">
          <ShieldCheck size={14} aria-hidden="true" />
          <span className="font-medium">Research instrument — not a medical device</span>
        </div>
        <span>
          Not for clinical use. Results are simulated until a validated model is
          connected and evaluated.
        </span>
      </div>
    </footer>
  </div>
);

export default Home;
