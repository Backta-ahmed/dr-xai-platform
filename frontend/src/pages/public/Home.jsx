import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Check,
  Eye,
  FileCheck2,
  Layers,
  Lock,
  Menu,
  Microscope,
  ScanEye,
  ShieldCheck,
  TriangleAlert,
  Stethoscope,
  Upload,
  X,
} from "lucide-react";

import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants";
import { useReveal } from "../../hooks/useReveal";

/**
 * Public entry point for a paid clinical service.
 *
 * Structure follows what comparable DR-screening products put on their front
 * page — how it works, who it is for, the evidence, the plans — but the angle is
 * different. Those products sell *automation* to primary care: a verdict in ten
 * seconds, no specialist needed. This one sells to the specialist, for whom
 * automation is not the selling point. Inspectability is: every claim the model
 * makes can be checked against the pixels it came from.
 *
 * The copy addresses the reader directly and avoids talking about competitors,
 * idiom that does not survive translation, and headings that are clever rather
 * than clear. Most of this audience does not read English first.
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
    body: "Add a fundus photograph and record which eye it is. JPEG, PNG, TIFF, BMP and WEBP, from any camera.",
  },
  {
    icon: ScanEye,
    title: "Analyse",
    body: "The image is graded on the ICDR scale, lesions are segmented by class, and an explanation is produced for the grade.",
  },
  {
    icon: FileCheck2,
    title: "Verify and sign",
    body: "Compare the overlays against the image, write your own assessment, and export a report carrying both.",
  },
];

const DIFFERENTIATORS = [
  {
    icon: Layers,
    title: "Evidence, not just a grade",
    body: "Lesion masks and explanation heatmaps sit over the scan in the same viewport, at the same zoom. Turn them on and off as you read.",
  },
  {
    icon: Microscope,
    title: "No simplification",
    body: "No textbook definitions, no referral prompts, no plain-language summary. The interface assumes you read fundus images for a living.",
  },
  {
    icon: Activity,
    title: "A record per eye, over time",
    body: "Every result is filed against a patient and a specific eye, so today's scan can be read against earlier scans of that same eye.",
  },
  {
    icon: Lock,
    title: "Your patients stay yours",
    body: "Patients and results are visible only to the clinician who created them. Images are served through authenticated requests, never public links, and every access is written to an audit log.",
  },
];

// Photographs are Pexels, which permits commercial use without attribution.
// They illustrate the settings the platform is used in; they are not customers,
// and nothing on the page presents them as endorsing it.
const AUDIENCES = [
  {
    icon: Stethoscope,
    title: "Individual ophthalmologists",
    body: "Screening clinics and private practice, where a second read shortens the queue without handing over the judgment.",
    image: "/img/slit-lamp.jpg",
    alt: "A patient positioned at a slit lamp during an eye examination.",
  },
  {
    icon: Eye,
    title: "Eye departments",
    body: "Shared patient records within a department, each clinician seeing their own list, with an administrator managing access.",
    image: "/img/phoropter.jpg",
    alt: "A clinician adjusting a phoropter in front of a patient in an eye clinic.",
  },
  {
    icon: Microscope,
    title: "Research groups",
    body: "Reproducible grading with model provenance recorded per result, so a cohort can be re-read when the model changes.",
    image: "/img/research.jpg",
    alt: "Researchers working at benches in a laboratory.",
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
    "Qualified ophthalmologists. Every application is checked against a medical licence or specialist certificate before access is granted. There is no self-service sign-up.",
  ],
  [
    "Does it replace my reading?",
    "No, and it is not built to. The model reads second, and you inspect what it based its grade on. Your own assessment is stored alongside it and appears on the exported report.",
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
  <section id={id} className="scroll-mt-20 border-t border-cyprus/10 py-16 lg:py-20">
    {eyebrow && (
      <p data-reveal className="text-xs font-semibold uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
    )}
    <h2
      data-reveal
      className="mt-2 text-xl font-semibold tracking-tight text-cyprus sm:text-2xl"
    >
      {title}
    </h2>
    {lead && (
      <p data-reveal className="mt-3 max-w-prose text-base leading-relaxed text-ink-soft">
        {lead}
      </p>
    )}
    <div className="mt-8">{children}</div>
  </section>
);

/**
 * The only figures on this page that are true today. Every comparable product
 * leads with sensitivity and specificity; those do not exist here yet, and the
 * Evidence section says so. These describe what the platform does rather than
 * how well it does it, which is the honest version of the same move.
 */
const PROOF = [
  ["0–4", "ICDR stages graded, the scale you already report in"],
  ["4", "Lesion classes marked on the image — EX, HE, MA, SE"],
  ["2", "Readings on every report: the model's, and yours"],
];

/**
 * Inside the hero's dark block rather than a band of its own.
 *
 * It previously sat on cyprus (#004741) directly beneath the hero's
 * cyprus-dark (#003330) — 1.30:1 apart, so two surfaces meant to read as
 * separate bands looked like one muddy mass with a seam. One dark block with a
 * hairline divider, and a single transition to the page below it.
 *
 * The count-up is gone. Animating a rise to "4" is motion for its own sake,
 * and it had already needed a fix for settling on the wrong number — a counter
 * that can land on 3 under the words "lesion classes marked" is worse than no
 * counter.
 */
const ProofStrip = () => (
  <dl className="mt-14 grid grid-cols-1 gap-8 border-t border-white/15 pt-10 sm:grid-cols-3 sm:gap-6">
    {PROOF.map(([value, label], i) => (
      <div key={value} data-reveal className={i > 0 ? "sm:border-l sm:border-white/10 sm:pl-6" : ""}>
        <dd className="tabular text-3xl font-bold tracking-tight text-white">{value}</dd>
        <dt className="mt-1.5 text-sm leading-relaxed text-white/70">{label}</dt>
      </div>
    ))}
  </dl>
);

const NAV = [
  ["How it works", "#how"],
  ["Why DR-XAI", "#why"],
  ["Evidence", "#evidence"],
  ["Plans", "#plans"],
  ["FAQ", "#faq"],
];

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  // One scope for the whole page; every [data-reveal] inside it animates in on
  // scroll. See useReveal for why nothing here can end up permanently hidden.
  const scope = useReveal();

  return (
    <div ref={scope} className="min-h-screen bg-sand">
    {/* Dark, to sit continuously with the hero beneath it rather than cutting
        a pale band across the top of it. It also matches the signed-in
        sidebar, so the product does not change identity at the door. */}
    <header className="sticky top-0 z-30 border-b border-white/10 bg-cyprus-dark/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        {/* nowrap: at 375px "DR-XAI Platform" broke across two lines and pushed
            the header to double height. */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5 text-white">
          <Eye size={22} className="flex-shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight sm:text-md">
            DR-XAI Platform
          </span>
        </Link>
        {/* lg, not md. At 768px these five links wrapped onto two lines and the
            last one sat flush against the Sign in button with no gap at all —
            an iPad in portrait is a completely mainstream width for a clinician
            to arrive on. Below lg they move into the disclosure menu. */}
        <div className="hidden items-center gap-6 lg:flex">
          {NAV.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-sm text-sm text-white/75 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link to={ROUTES.LOGIN}>
            <Button variant="outlineLight" size="md" className="px-3 sm:px-4">
              Sign in
            </Button>
          </Link>
          <Link to={ROUTES.REQUEST_ACCESS}>
            <Button variant="onDark" size="md" className="px-3 sm:px-4">
              {/* "Request access" is two words too many at 375px. */}
              <span className="sm:hidden">Apply</span>
              <span className="hidden sm:inline">Request access</span>
            </Button>
          </Link>
          {/* Without this the five section links simply vanished below lg, with
              no replacement — a phone visitor wanting the pricing or the FAQ
              had to blind-scroll the whole page to find them. */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            // h-11 w-11 = 44px, the touch-target minimum. At h-10 it was 40.
            className="flex h-11 w-11 items-center justify-center rounded-control border border-white/25 text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            {React.createElement(menuOpen ? X : Menu, { size: 18, "aria-hidden": "true" })}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="site-menu" className="border-t border-white/10 bg-cyprus-dark lg:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-2">
            {NAV.map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-control px-2 py-3 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>

    <main>
      {/* Full-bleed and dark. The page previously opened on a pale grid that
          looked like a document; the first screen now reads as an instrument,
          which is what the product is. */}
      <section className="relative overflow-hidden bg-cyprus-dark">
        {/* Depth without introducing a colour: two washes of the existing
            accent and cyprus-light, well below the text contrast path. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-52 -left-32 h-[30rem] w-[30rem] rounded-full bg-cyprus-light/30 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <p
              data-reveal
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80"
            >
              <ScanEye size={13} aria-hidden="true" />
              For ophthalmologists
            </p>
            <h1
              data-reveal
              // Emphasis by opacity, not by colour. The accent is #00736B,
              // which measures about 1.9:1 on cyprus-dark — fine as a button
              // fill behind white text, unusable as text itself. The palette is
              // frozen, so the second clause simply gets full white against a
              // dimmed first clause.
              className="mt-5 text-[2rem] font-bold leading-[1.1] tracking-tight text-white/70 sm:text-[2.75rem] lg:text-[3.15rem]"
            >
              Diabetic retinopathy grading you can{" "}
              <span className="text-white">check against the image.</span>
            </h1>
            <p
              data-reveal
              className="mt-5 max-w-prose text-base leading-relaxed text-white/75 sm:text-lg"
            >
              The model returns an ICDR grade and marks the lesions behind it, on the
              same image and at the same zoom you are already working at. Confirm it or
              overrule it — your assessment is what goes on the report.
            </p>

            <div data-reveal className="mt-9 flex flex-wrap gap-3">
              <Link to={ROUTES.REQUEST_ACCESS}>
                <Button variant="onDark" size="xl">Request clinician access</Button>
              </Link>
              <a href="#how">
                <Button variant="outlineLight" size="xl">See how it works</Button>
              </a>
            </div>

            <p data-reveal className="mt-6 max-w-prose text-sm leading-relaxed text-white/60">
              Accounts are for qualified ophthalmologists only. Every application is
              checked against your medical registration before access is granted.
            </p>
          </div>

          {/* Kept beside the headline rather than in a footnote. Someone deciding
              whether to apply should learn this before they scroll. */}
          <aside data-reveal className="lg:col-span-5">
            {/* Border pulled back and the heading lightened. The orange was the
                only saturated colour on the screen, so the caveat was winning
                the first glance over the offer; and #E67E22 on this tinted card
                measures 4.38:1, just under AA. warning-bright reads 5.20:1. */}
            <div className="rounded-card border border-warning/30 bg-warning/10 p-6 backdrop-blur-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-warning-bright">
                <TriangleAlert size={15} aria-hidden="true" />
                Early access — model in development
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                No diagnostic model is connected yet. Every result the platform produces
                today is randomly generated. It is labelled as simulated wherever it
                appears and watermarked on every exported report, and it must not inform
                patient care.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                The grading, segmentation and explanation pipeline is in development.
                Accounts are open now so clinicians can work through the workflow before
                it arrives.{" "}
                <strong className="text-white">Nothing is billable until it does.</strong>
              </p>
            </div>
          </aside>

          <div className="lg:col-span-12">
            <ProofStrip />
          </div>
        </div>

        {/* The hero-to-page seam was a 9:1 luminance jump made as a hard tile
            swap. A short fade into the page colour turns it into a handoff. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-sand"
        />
      </section>

      <div className="mx-auto max-w-6xl px-5">

      <Section
        id="how"
        eyebrow="How it works"
        title="From photograph to signed report"
        lead="Three steps. The reading signed at the end is yours, not the model's."
      >
        <ol data-reveal-group className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon, title, body }, i) => (
            <li
              key={title}
              data-reveal
              className="rounded-card bg-white p-5 shadow-card transition-shadow hover:shadow-raised"
            >
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
              <h3 className="mt-3 text-md font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="why"
        eyebrow="Why DR-XAI"
        title="Designed for the specialist reader"
        lead="You are the referral endpoint, not a screener deciding whether to send someone on. So the platform offers evidence you can inspect, and no opinion about what to do next."
      >
        <div data-reveal-group className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          {DIFFERENTIATORS.map(({ icon, title, body }) => (
            <div key={title} data-reveal className="flex gap-3.5">
              {React.createElement(icon, {
                size: 20,
                className: "mt-0.5 flex-shrink-0 text-accent",
                "aria-hidden": "true",
              })}
              <div>
                <h3 className="text-md font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="who" eyebrow="Who it is for" title="Where it fits">
        <div data-reveal-group className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {AUDIENCES.map(({ icon, title, body, image, alt }) => (
            <div
              key={title}
              data-reveal
              className="group overflow-hidden rounded-card border border-cyprus/15 bg-white transition-shadow hover:shadow-raised"
            >
              <img
                src={image}
                alt={alt}
                width={720}
                height={540}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="p-5">
                {React.createElement(icon, {
                  size: 20,
                  className: "text-accent",
                  "aria-hidden": "true",
                })}
                <h3 className="mt-3 text-md font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="evidence"
        eyebrow="Evidence"
        title="Performance figures are not published yet"
        lead="Sensitivity and specificity will be published here, per grade and per lesion class, once the model has been evaluated on a held-out set. Not before."
      >
        <div data-reveal className="rounded-card border border-dashed border-cyprus/30 bg-white/60 p-6">
          <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
            Every result already records which model and which version produced it. So
            when figures do exist, any report can be tied to the exact version behind
            it — including, looking back, every result that came from the placeholder.
          </p>
        </div>
      </Section>

      <Section
        id="plans"
        eyebrow="Plans"
        title="Plans and pricing"
        lead="What the service will cost once it ships. No plan is billable while the model is in development, and early-access accounts are free until then."
      >
        <div data-reveal-group className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              data-reveal
              className={`flex flex-col rounded-card p-6 ${
                plan.featured
                  ? "bg-cyprus text-white shadow-raised ring-2 ring-accent"
                  : "border border-cyprus/15 bg-white shadow-card"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3
                  className={`text-md font-semibold ${
                    plan.featured ? "text-white" : "text-ink"
                  }`}
                >
                  {plan.name}
                </h3>
                {plan.featured && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-white">
                    Recommended
                  </span>
                )}
              </div>
              <p
                className={`mt-1 text-sm ${
                  plan.featured ? "text-white/80" : "text-ink-soft"
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
                    plan.featured ? "text-white/70" : "text-ink-soft"
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
                    <span className={plan.featured ? "text-white/90" : "text-ink-soft"}>
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

      <Section id="faq" eyebrow="FAQ" title="Common questions">
        <dl data-reveal-group className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q} data-reveal>
              <dt className="text-md font-semibold text-ink">{q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{a}</dd>
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
            <Button variant="accent" size="xl">Get started</Button>
          </Link>
        </div>
      </section>
      </div>
    </main>

    <footer className="border-t border-cyprus/10 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 text-xs text-ink-soft">
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
};

export default Home;
