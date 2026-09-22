import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
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

import EvidenceFlow from "../../components/public/EvidenceFlow";
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

/**
 * Section tones.
 *
 * `deep` is a full-bleed band in cyprus, used once to break what was otherwise
 * an unbroken cream scroll from the hero to the footer.
 *
 * It must never sit directly against the hero: cyprus #004741 and the hero's
 * cyprus-dark #003330 measure 1.30:1 apart, so adjacent they read as one mass
 * with a seam rather than two bands. A sand section between them is what makes
 * the second dark band land as a deliberate return rather than a smudge.
 */
const TONES = {
  sand: {
    section: "border-t border-cyprus/10",
    eyebrow: "text-accent",
    title: "text-cyprus",
    lead: "text-ink-soft",
  },
  deep: {
    section: "bg-cyprus",
    eyebrow: "text-white/75",
    title: "text-white",
    lead: "text-white/80",
  },
};

const Section = ({ id, eyebrow, title, lead, tone = "sand", children }) => {
  const t = TONES[tone] ?? TONES.sand;
  return (
    <section id={id} className={`scroll-mt-20 py-16 lg:py-20 ${t.section}`}>
      <div className="mx-auto max-w-6xl px-5">
        {eyebrow && (
          <p
            data-reveal
            className={`text-xs font-semibold uppercase tracking-widest ${t.eyebrow}`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          data-reveal
          className={`mt-2.5 max-w-[22ch] text-2xl font-semibold leading-[1.15] tracking-tight sm:text-[2rem] ${t.title}`}
        >
          {title}
        </h2>
        {lead && (
          <p data-reveal className={`mt-4 max-w-[58ch] text-lg leading-relaxed ${t.lead}`}>
            {lead}
          </p>
        )}
        <div className="mt-10 lg:mt-12">{children}</div>
      </div>
    </section>
  );
};

/**
 * The only figures on this page that are true today. Every comparable product
 * leads with sensitivity and specificity; those do not exist here yet, and the
 * Evidence section says so. These describe what the platform does rather than
 * how well it does it, which is the honest version of the same move.
 */
const PROOF = [
  { value: "0–4", label: "ICDR stages graded, the scale you already report in", icon: Activity },
  { value: "4", label: "Lesion classes marked on the image — EX, HE, MA, SE", icon: Layers },
  { value: "2", label: "Readings on every report: the model's, and yours", icon: FileCheck2 },
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
  <dl className="mt-10 grid grid-cols-1 gap-7 border-t border-white/15 pt-9 sm:grid-cols-3 sm:gap-8">
    {PROOF.map(({ value, label, icon }, i) => (
      <div
        key={value}
        data-reveal
        className={`flex gap-4 ${i > 0 ? "sm:border-l sm:border-white/10 sm:pl-8" : ""}`}
      >
        <span
          aria-hidden="true"
          className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control border border-white/15 bg-white/[0.06] text-white/70"
        >
          {React.createElement(icon, { size: 16 })}
        </span>
        <div>
          <dd className="tabular text-[2rem] font-bold leading-none tracking-tight text-white">
            {value}
          </dd>
          <dt className="mt-2 text-sm leading-relaxed text-white/70">{label}</dt>
        </div>
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
  // The header sits on the hero's own colour at rest and gains a border and a
  // blur once the page moves, so it reads as part of the hero until it isn't.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // One scope for the whole page; every [data-reveal] inside it animates in on
  // scroll. See useReveal for why nothing here can end up permanently hidden.
  const scope = useReveal();

  return (
    <div ref={scope} className="min-h-screen bg-sand">
    {/* Dark, to sit continuously with the hero beneath it rather than cutting
        a pale band across the top of it. It also matches the signed-in
        sidebar, so the product does not change identity at the door. */}
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-cyprus-dark/95 backdrop-blur"
          : "border-b border-transparent bg-cyprus-dark"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
        {/* nowrap: at 375px "DR-XAI Platform" broke across two lines and pushed
            the header to double height. */}
        <Link to={ROUTES.HOME} className="flex min-h-11 items-center gap-2.5 text-white">
          <Eye size={22} className="flex-shrink-0" aria-hidden="true" />
          {/* At 360px the full wordmark plus two buttons plus the menu toggle
              left the toggle on the viewport edge. "Platform" is the part that
              carries no information. */}
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight sm:text-md">
            DR-XAI<span className="hidden xs:inline sm:inline"> Platform</span>
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
              className="group relative flex min-h-11 items-center rounded-sm text-sm text-white/75 transition-colors hover:text-white"
            >
              {label}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-3 h-px origin-left scale-x-0 bg-white/60 transition-transform duration-200 group-hover:scale-x-100"
              />
            </a>
          ))}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link to={ROUTES.LOGIN}>
            <Button variant="outlineLight" size="md" className="min-h-11 px-3 sm:px-4">
              Sign in
            </Button>
          </Link>
          <Link to={ROUTES.REQUEST_ACCESS}>
            <Button variant="onDark" size="md" className="min-h-11 px-3 sm:px-4">
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
        <div
          id="site-menu"
          className="animate-auth-rise border-t border-white/10 bg-cyprus-dark lg:hidden"
        >
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
      <section className="relative overflow-x-clip bg-cyprus-dark">
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

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 py-16 lg:grid-cols-12 lg:gap-0 lg:py-28">
          {/* z-10 so the copy always sits above the photograph where they
              overlap. The image is pulled under this column, never over it. */}
          <div className="relative z-10 lg:col-span-6">
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

            {/* One button, one link. Two buttons of equal size made the reader
                choose between them; the secondary action is a wayfinding aid,
                not an alternative to applying. */}
            <div data-reveal className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to={ROUTES.REQUEST_ACCESS}>
                <Button variant="onDark" size="xl">Request clinician access</Button>
              </Link>
              <a
                href="#how"
                className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                See how it works
                <ArrowRight
                  size={15}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>

            <p data-reveal className="mt-6 max-w-prose text-sm leading-relaxed text-white/60">
              Accounts are for qualified ophthalmologists only. Every application is
              checked against your medical registration before access is granted.
            </p>
          </div>

          {/* The subject, at the scale the product works at. The warning used to
              hold this column and was the loudest thing on the screen.

              Graded toward cyprus before it was ever committed, so the warm
              skin tones do not fight the section, and scrimmed along the left
              and bottom edges so it reads as part of the hero rather than a
              photograph pasted onto it. */}
          {/* Larger than its column and pulled left so it tucks under the copy.
              It also breaks the right gutter, so the eye runs toward the edge
              of the screen rather than stopping politely inside the grid.
              Everything here is lg-only: at narrower widths the two stack and
              an overlap would put the photograph under the headline. */}
          <div
            data-reveal
            className="relative lg:col-span-6 lg:-ml-24 lg:w-[calc(100%+6rem)] xl:-mr-16 xl:w-[calc(100%+10rem)]"
          >
            {/* A soft bloom behind the frame, in the accent, so the image is
                lit from within the section instead of pasted onto it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-accent/15 blur-3xl"
            />

            <figure className="relative overflow-hidden rounded-2xl shadow-modal ring-1 ring-white/15">
              <img
                src="/img/eye-macro.jpg"
                alt="Extreme close-up of a human eye, the iris filling the frame."
                width={1200}
                height={900}
                fetchPriority="high"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />

              {/* The left third fades to the hero colour. That is what makes the
                  overlap safe: where the photograph passes behind the copy it is
                  effectively the section background, not an image. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyprus-dark via-cyprus-dark/55 to-transparent lg:via-cyprus-dark/25"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cyprus-dark/95 via-cyprus-dark/55 to-transparent"
              />

              {/* white/90 over a deep scrim. At white/70 the brightest pixels
                  under this strip — pale sclera and skin — pulled the worst case
                  to 4.45:1, under AA for 11px text. A photograph cannot hold a
                  contrast ratio on its own. */}
              <figcaption className="absolute bottom-5 left-6 right-6 text-2xs font-semibold uppercase tracking-widest text-white/90 lg:left-auto lg:right-7 lg:max-w-[20rem] lg:text-right xl:right-24">
                Diabetic retinopathy · the leading cause of blindness in working-age adults
              </figcaption>
            </figure>
          </div>

          {/* The disclosure keeps every word, and stays above the fold. It
              reads as a status strip now rather than a second product card —
              the caveat should be impossible to miss and still lose the first
              glance to the offer. */}
          <aside
            data-reveal
            className="rounded-card border border-warning/25 bg-warning/[0.07] p-5 lg:col-span-12"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
              <h2 className="flex flex-shrink-0 items-center gap-2 text-2xs font-bold uppercase tracking-widest text-warning-bright">
                <TriangleAlert size={14} aria-hidden="true" />
                Early access — model in development
              </h2>
              <div className="sm:border-l sm:border-warning/20 sm:pl-5">
                <p className="text-sm leading-relaxed text-white/80">
                  No diagnostic model is connected yet. Every result the platform produces
                  today is randomly generated. It is labelled as simulated wherever it
                  appears and watermarked on every exported report, and it must not inform
                  patient care.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  The grading, segmentation and explanation pipeline is in development.
                  Accounts are open now so clinicians can work through the workflow before
                  it arrives.{" "}
                  <strong className="text-white">Nothing is billable until it does.</strong>
                </p>
              </div>
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

      <Section
        id="how"
        eyebrow="How it works"
        title="From photograph to signed report"
        lead="Three steps. The reading signed at the end is yours, not the model's."
      >
        {/* A progression, not three isolated boxes. The rule behind the step
            markers connects them on desktop and disappears when they stack,
            where reading order already carries the sequence. */}
        <ol data-reveal-group className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-7">
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-[22px] hidden h-px bg-cyprus/15 sm:block"
          />
          {STEPS.map(({ icon, title, body }, i) => (
            <li key={title} data-reveal className="group relative">
              <div className="flex items-center gap-3">
                <span className="relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-cyprus text-sm font-bold text-white ring-4 ring-sand transition-transform duration-300 group-hover:scale-105">
                  {i + 1}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-control border border-cyprus/15 bg-white text-accent">
                  {React.createElement(icon, { size: 17, "aria-hidden": "true" })}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{title}</h3>
              <p className="mt-2 max-w-[34ch] text-base leading-relaxed text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* The one dark band below the hero. This section argues the case for the
          product, so it is the one worth lifting off the page — and it sits far
          enough down that it reads as a deliberate return to the brand colour
          rather than a continuation of the hero. */}
      <Section
        id="why"
        tone="deep"
        eyebrow="Why DR-XAI"
        title="Designed for the specialist reader"
        lead="You are the referral endpoint, not a screener deciding whether to send someone on. So the platform offers evidence you can inspect, and no opinion about what to do next."
      >
        <EvidenceFlow />

        <div
          data-reveal-group
          className="mt-14 grid grid-cols-1 gap-x-10 gap-y-7 border-t border-white/12 pt-10 sm:grid-cols-2"
        >
          {DIFFERENTIATORS.map(({ icon, title, body }) => (
            <div key={title} data-reveal className="flex gap-3.5">
              {React.createElement(icon, {
                size: 18,
                className: "mt-1 flex-shrink-0 text-white/60",
                "aria-hidden": "true",
              })}
              <div>
                <h3 className="text-md font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="who" eyebrow="Who it is for" title="Where it fits">
        <div data-reveal-group className="grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-3">
          {AUDIENCES.map(({ icon, title, body, image, alt }) => (
            <div key={title} data-reveal className="group">
              <div className="overflow-hidden rounded-card">
                <img
                  src={image}
                  alt={alt}
                  width={720}
                  height={540}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <h3 className="mt-5 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink">
                {React.createElement(icon, {
                  size: 18,
                  className: "flex-shrink-0 text-accent",
                  "aria-hidden": "true",
                })}
                {title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-soft">{body}</p>
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
        <div
          data-reveal
          className="rounded-card border-l-4 border-l-accent bg-white px-7 py-6 shadow-card"
        >
          <p className="max-w-[62ch] text-base leading-relaxed text-ink-soft">
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
              className={`flex flex-col rounded-card p-7 transition-shadow ${
                plan.featured
                  ? "bg-cyprus text-white shadow-raised"
                  : "border border-cyprus/15 bg-white hover:shadow-card"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3
                  className={`text-lg font-semibold tracking-tight ${
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
                <Button variant={plan.featured ? "accent" : "secondary"} fullWidth className="min-h-11">
                  Request access
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Common questions">
        <dl data-reveal-group className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
          {FAQ.map(([q, a], i) => (
            <div
              key={q}
              data-reveal
              className={`py-6 ${i > 1 ? "border-t border-cyprus/10" : "sm:pt-0"} ${
                i === 1 ? "border-t border-cyprus/10 sm:border-t-0" : ""
              }`}
            >
              <dt className="text-lg font-semibold tracking-tight text-ink">{q}</dt>
              <dd className="mt-2 max-w-[52ch] text-base leading-relaxed text-ink-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <section className="border-t border-cyprus/10 py-14">
        <div
          data-reveal
          className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-xl bg-cyprus px-8 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
              Request clinician access
            </h2>
            <p className="mt-2.5 max-w-[52ch] text-base leading-relaxed text-white/80">
              Submit your registration number and proof of qualification. An
              administrator verifies your credentials before an account is created.
            </p>
          </div>
          <Link to={ROUTES.REQUEST_ACCESS} className="flex-shrink-0">
            <Button variant="accent" size="xl">Get started</Button>
          </Link>
        </div>
      </section>
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
