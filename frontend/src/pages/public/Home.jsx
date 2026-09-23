import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  FileCheck2,
  Layers,
  Lock,
  Menu,
  Microscope,
  ScanEye,
  ShieldCheck,
  Stethoscope,
  Upload,
  X,
} from "lucide-react";

import { buttonClass } from "../../components/ui/buttonClass";
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
 *
 * ── On the layout ─────────────────────────────────────────────────────────
 * The page used to be a stack: every section an eyebrow, a heading, a lead and
 * a row of cards, full width, nine times over. That shape is why a landing page
 * reads as assembled rather than designed — the reader learns the rhythm in two
 * sections and stops looking. Sections now alternate between an editorial split
 * (the heading held in a narrow left column, the content in a wide well beside
 * it) and full width, chosen per section by what the content needs: a photo
 * trio and a four-step flow need the width, an argument and an FAQ do not.
 */

const STEPS = [
  {
    icon: Upload,
    title: "Capture",
    body: "A fundus photograph enters the workflow with its laterality recorded. JPEG, PNG, TIFF, BMP or WEBP, from any camera.",
  },
  {
    icon: ScanEye,
    title: "Inspect",
    body: "The model marks what it found and where, as layers over the image — evidence you can turn on and off while you read.",
  },
  {
    icon: Microscope,
    title: "Review",
    body: "You read the overlays against the photograph at your own zoom, and decide what they amount to.",
  },
  {
    icon: FileCheck2,
    title: "Report",
    body: "Your interpretation is recorded beside the model's output, and both go on the exported report.",
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
    image: `${import.meta.env.BASE_URL}img/slit-lamp.jpg`,
    alt: "A patient positioned at a slit lamp during an eye examination.",
  },
  {
    icon: Eye,
    title: "Eye departments",
    body: "Shared patient records within a department, each clinician seeing their own list, with an administrator managing access.",
    image: `${import.meta.env.BASE_URL}img/phoropter.jpg`,
    alt: "A clinician adjusting a phoropter in front of a patient in an eye clinic.",
  },
  {
    icon: Microscope,
    title: "Research groups",
    body: "Reproducible grading with model provenance recorded per result, so a cohort can be re-read when the model changes.",
    image: `${import.meta.env.BASE_URL}img/research.jpg`,
    alt: "Researchers working at benches in a laboratory.",
  },
];

/**
 * A second tier under the three photographed settings.
 *
 * Taken from a competing layout, which listed four audiences as four identical
 * icon cards. Four equal cards say the four are equally central, and they are
 * not — the first three are where the product is bought and used, these two are
 * where it also fits. Flattening that into one row loses the information; a
 * lighter second row keeps it.
 */
const ALSO_FITS = [
  {
    icon: Layers,
    title: "Teaching and review sessions",
    body: "An inspectable interface makes the reasoning discussable, rather than a grade to take on trust.",
  },
  {
    icon: FileCheck2,
    title: "One place for the whole read",
    body: "Image, evidence, interpretation and report stay on the same record instead of in four systems.",
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
  [
    "What happens when the model ships?",
    "Early-access accounts carry over with their patient records intact. Results produced during development stay permanently marked as simulated, so nothing from this period can later be mistaken for a real reading.",
  ],
];

/**
 * What gets published in the Evidence section, and what has to be true first.
 *
 * This replaces a generic transparency checklist. Every comparable product
 * leads its evidence section with sensitivity and specificity; this one cannot
 * yet, and the useful thing to show a specialist is not an apology but the
 * specification of the figures they will eventually be asked to trust.
 */
const WILL_PUBLISH = [
  "Sensitivity and specificity, reported per ICDR grade rather than pooled.",
  "Segmentation performance per lesion class — EX, HE, MA and SE separately.",
  "The held-out set, its size, and how it was partitioned from training data.",
  "The model version each figure belongs to, so a result can be traced to it.",
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
    title: "text-cyprus",
    lead: "text-ink-soft",
  },
  light: {
    section: "border-t border-cyprus/10 bg-sand-light",
    title: "text-cyprus",
    lead: "text-ink-soft",
  },
  deep: {
    section: "bg-cyprus",
    title: "text-white",
    lead: "text-white/80",
  },
};

/**
 * One section shell, two compositions.
 *
 * `split` holds the heading in a narrow left column and gives the content a
 * wide well beside it — the editorial shape. `sticky` additionally pins that
 * heading while a tall well scrolls past it, which is only worth doing where
 * the well is genuinely tall; against a short one the heading appears to stall.
 *
 * There is deliberately no eyebrow prop any more. A kicker above every heading
 * was the loudest template signal on the page, and in every case it was
 * repeating a word already in the heading beneath it or in the nav link that
 * brought the reader here.
 */
const Section = ({
  id,
  title,
  lead,
  tone = "sand",
  split = false,
  sticky = false,
  children,
}) => {
  const t = TONES[tone] ?? TONES.sand;

  const head = (
    <>
      <h2
        data-reveal
        className={`text-pretty text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-balance sm:text-[2.125rem] ${
          split ? "max-w-[16ch]" : "max-w-[22ch]"
        } ${t.title}`}
      >
        {title}
      </h2>
      {lead && (
        <p
          data-reveal
          className={`mt-5 text-base leading-relaxed sm:text-lg ${
            split ? "max-w-[42ch]" : "max-w-[58ch]"
          } ${t.lead}`}
        >
          {lead}
        </p>
      )}
    </>
  );

  return (
    <section id={id} className={`scroll-mt-20 py-16 lg:py-24 ${t.section}`}>
      <div className="mx-auto max-w-6xl px-5">
        {split ? (
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
            <div
              className={`lg:col-span-4 ${sticky ? "lg:sticky lg:top-24 lg:self-start" : ""}`}
            >
              {head}
            </div>
            <div className="lg:col-span-7 lg:col-start-6">{children}</div>
          </div>
        ) : (
          <>
            {head}
            <div className="mt-12 lg:mt-14">{children}</div>
          </>
        )}
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
  {
    value: "0–4",
    term: "ICDR stages",
    label: "The severity scale you already report in.",
    icon: Activity,
  },
  {
    value: "4",
    term: "Lesion classes",
    label: "Exudates, haemorrhages, microaneurysms, soft exudates.",
    icon: Layers,
  },
  {
    value: "2",
    term: "Readings per report",
    label: "The model's, and the one you sign.",
    icon: FileCheck2,
  },
];

/**
 * Its own pale band between the hero and the product, rather than the last
 * block inside the hero.
 *
 * It lived inside the dark hero because the alternative then was cyprus under
 * cyprus-dark — 1.30:1, one muddy mass with a seam. On sand there is no such
 * collision, and lifting it out gives the hero a clean bottom edge and the page
 * its first change of surface within one screen of scrolling.
 *
 * The count-up is gone. Animating a rise to "4" is motion for its own sake, and
 * it had already needed a fix for settling on the wrong number — a counter that
 * can land on 3 under the words "lesion classes" is worse than no counter.
 */
const ProofStrip = () => (
  <section className="border-b border-cyprus/10 bg-sand-light">
    <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-x-8 gap-y-9 px-5 py-12 sm:grid-cols-3 lg:py-14">
      {PROOF.map(({ value, term, label, icon }, i) => (
        <div
          key={value}
          data-reveal
          className={`flex items-start gap-4 ${
            i > 0 ? "sm:border-l sm:border-cyprus/12 sm:pl-8" : ""
          }`}
        >
          <span
            aria-hidden="true"
            className="mt-1.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control border border-cyprus/15 bg-white text-accent"
          >
            {React.createElement(icon, { size: 18 })}
          </span>
          <div>
            <dd className="tabular text-[2.25rem] font-bold leading-none tracking-tight text-cyprus">
              {value}
            </dd>
            <dt className="mt-2.5 text-md font-semibold tracking-tight text-ink">{term}</dt>
            <p className="mt-1 max-w-[30ch] text-sm leading-relaxed text-ink-soft">{label}</p>
          </div>
        </div>
      ))}
    </dl>
  </section>
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

  // Escape closes the disclosure menu. Tab order and the toggle both worked,
  // but Escape is the expected way out of any open panel and its absence reads
  // as unfinished.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

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
    {/* First focusable element on the page. Without it a keyboard user tabbed
        the logo, five nav links and two buttons before reaching any content. */}
    <a
      href="#main"
      className="sr-only rounded-control focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-sand focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-cyprus"
    >
      Skip to content
    </a>

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
          {/* The anchor IS the button. A Button component wrapped in a Link
              nested interactive content inside interactive content — invalid
              HTML, and it gave every CTA two tab stops at the same
              coordinates: the anchor, then an inert button on top of it. */}
          <Link
            to={ROUTES.LOGIN}
            className={buttonClass({
              variant: "outlineLight",
              size: "md",
              className: "min-h-11 px-3 sm:px-4",
            })}
          >
            Sign in
          </Link>
          <Link
            to={ROUTES.REQUEST_ACCESS}
            className={buttonClass({
              variant: "onDark",
              size: "md",
              className: "min-h-11 px-3 sm:px-4",
            })}
          >
            {/* "Request access" is two words too many at 375px. */}
            <span className="sm:hidden">Apply</span>
            <span className="hidden sm:inline">Request access</span>
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

    <main id="main">
      {/* Full-bleed and dark. The page previously opened on a pale grid that
          looked like a document; the first screen now reads as an instrument,
          which is what the product is. */}
      {/* Full-bleed. The photograph is the section, not an object inside it —
          a boxed image in a column always reads as an illustration bolted on.
          The frame is cropped so the eye lands right of centre and the copy
          gets the calmer side, and the scrim below does the rest. */}
      <section className="relative isolate overflow-hidden bg-cyprus-dark">
        {/* Two treatments, because one does not work at both ends.
            
            On md+ the photograph is the section background. On a phone the hero
            stacks to about 1400px tall against a 390px width — an 0.27 aspect
            that no photograph crops to. Covering it showed an eyelid, not an
            eye. So small screens get the photograph as a band at its own
            aspect, with the copy on solid colour beneath it, which is legible
            and deliberate rather than a desktop layout squeezed. */}
        {/* Also a background, for the same reason as the wide one below: an
            <img> with md:hidden still downloads on desktop, so this was costing
            every desktop visitor the 101KB portrait it never renders. Both are
            now behind their own media query, and each width fetches exactly
            one. Decorative — the headline carries the meaning. */}
        <div
          aria-hidden="true"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}img/eye-hero-sm.jpg)` }}
          className="h-56 w-full bg-cover bg-center bg-no-repeat md:hidden"
        />
        {/* A CSS background, not an <img>. Two <img> elements toggled with
            hidden/md:block both download — display:none does not stop a fetch,
            so every phone was pulling the 223KB wide crop it never shows and
            every desktop the 101KB portrait. A background inside a md: media
            query is only fetched when that query matches. */}
        <div
          aria-hidden="true"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}img/eye-hero.jpg)` }}
          className="absolute inset-0 -z-10 hidden bg-cover bg-right bg-no-repeat md:block"
        />

        {/* Two scrims. The horizontal one carries the copy side; the vertical
            one keeps the lower edge from competing with the section beneath.
            Measured, not guessed — see the contrast note in the commit. */}
        <div
          aria-hidden="true"
          // Explicit stops. Full cover across the copy (which ends at ~52% of
            // the viewport), then clear by 74% so the iris is not sitting under
            // a third of a layer of green — it was, and it dulled the one thing
            // the photograph is here for.
            className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-cyprus-dark from-15% via-cyprus-dark/88 via-50% to-transparent to-74% md:block"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden bg-gradient-to-t from-cyprus-dark/80 via-transparent to-cyprus-dark/45 md:block"
        />

        {/* Less top padding below md: the band above already gives the section
            its opening, so the full py-20 left a gap doing nothing. */}
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 md:py-20 lg:py-28">
          <div className="max-w-[38rem]">
            <p
              data-reveal
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-cyprus-dark/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/85 backdrop-blur-sm"
            >
              <ScanEye size={13} aria-hidden="true" />
              Clinician-first retinal AI
            </p>
            <h1
              data-reveal
              className="mt-6 text-[2.15rem] font-bold leading-[1.08] tracking-tight text-white/75 sm:text-[2.9rem] lg:text-[3.4rem]"
            >
              Inspectable AI evidence for{" "}
              <span className="text-white">retinal specialists.</span>
            </h1>
            <p
              data-reveal
              className="mt-6 max-w-[46ch] text-base leading-relaxed text-white/80 sm:text-lg"
            >
              DR-XAI helps ophthalmologists inspect retinal-image evidence and
              explanations, so you can make informed decisions while keeping your
              clinical judgment at the center.
            </p>

            <div data-reveal className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                to={ROUTES.REQUEST_ACCESS}
                className={buttonClass({ variant: "onDark", size: "xl" })}
              >
                Request clinician access
              </Link>
              <a
                href="#how"
                className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm py-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
              >
                See how it works
                <ArrowRight
                  size={15}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>

            <p data-reveal className="mt-6 max-w-[54ch] text-sm leading-relaxed text-white/70">
              Accounts are for qualified ophthalmologists only. Every application is
              checked against your medical registration before access is granted.
            </p>
          </div>

        </div>
      </section>

      <ProofStrip />


      <Section
        id="how"
        title="From photograph to signed report"
        lead="Four steps, and the reading signed at the end is yours, not the model's."
      >
        {/* A progression, not four isolated boxes. The rule behind the markers
            connects them and an arrow sits in each gap, so the row reads left to
            right as a sequence rather than as four things that happen to be
            adjacent. Both disappear when the cards stack, where reading order
            already carries it. */}
        <ol
          data-reveal-group
          className="relative grid grid-cols-1 gap-9 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:gap-7"
        >
          {/* The connector only appears where the four sit in one row. At two
              columns or stacked it would point at nothing. */}
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-[22px] hidden h-px bg-cyprus/15 lg:block"
          />
          {STEPS.map(({ icon, title, body }, i) => (
            <li key={title} data-reveal className="group relative">
              {/* gap-7 is 28px, so -22px drops the 16px glyph into the middle of
                  the gap, sitting on the connector rule. */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-[22px] top-[14px] hidden text-cyprus/35 lg:block"
                >
                  <ArrowRight size={16} />
                </span>
              )}
              <div className="flex items-center gap-3">
                {/* The one place a count earns its keep on this page: the order
                    of these four is itself the information. */}
                <span className="tabular relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-cyprus text-sm font-bold text-white ring-4 ring-sand transition-transform duration-300 group-hover:scale-105">
                  {String(i + 1).padStart(2, "0")}
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

        {/* The sentence the section exists to land, set at display size rather
            than fenced behind a coloured rule. A heavy left border is the
            reflex move for a pull quote, and it makes the words read as a
            callout component instead of as the page's own conclusion. */}
        <p
          data-reveal
          className="mt-16 max-w-[34ch] text-[1.5rem] font-semibold leading-[1.25] tracking-tight text-pretty text-cyprus sm:text-[1.75rem]"
        >
          The model supplies evidence. The interpretation, and the responsibility for
          it, stay with the clinician reading the image.
        </p>
      </Section>

      {/* The one dark band below the hero. This section argues the case for the
          product, so it is the one worth lifting off the page — and it sits far
          enough down that it reads as a deliberate return to the brand colour
          rather than a continuation of the hero. */}
      <Section
        id="why"
        tone="deep"
        split
        title="Designed for the specialist reader"
        lead="You are the referral endpoint, not a screener deciding whether to send someone on. So the platform offers evidence you can inspect, and no opinion about what to do next."
      >
        <div
          data-reveal-group
          className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2"
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

      {/* Full width. Three photographs need the room; dropped into an
          8-column well they crop to letterbox strips. */}
      <Section id="who" title="Where it fits">
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

        {/* Deliberately quieter than the row above: a rule, not a card, so the
            hierarchy between "who buys this" and "where it also fits" survives. */}
        <div
          data-reveal-group
          className="mt-12 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-cyprus/12 pt-8 sm:grid-cols-2"
        >
          {ALSO_FITS.map(({ icon, title, body }) => (
            <div key={title} data-reveal className="flex gap-3.5">
              {React.createElement(icon, {
                size: 18,
                className: "mt-1 flex-shrink-0 text-accent",
                "aria-hidden": "true",
              })}
              <div>
                <h3 className="text-md font-semibold tracking-tight text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Was a paragraph in a bordered box saying "not yet", which is an
          apology rather than a section. A specialist reading this page is
          deciding whether these figures will be worth anything when they
          arrive, so the useful content is the specification of them. */}
      <Section
        id="evidence"
        tone="light"
        split
        title="Performance figures are not published yet"
        lead="No sensitivity or specificity appears anywhere on this site, because none has been measured on a held-out set. When it has, this is exactly what goes here."
      >
        <ul data-reveal-group>
          {WILL_PUBLISH.map((item) => (
            <li
              key={item}
              data-reveal
              className="flex gap-4 border-b border-cyprus/12 py-5 first:border-t"
            >
              <Check size={18} className="mt-0.5 flex-shrink-0 text-accent" aria-hidden="true" />
              <span className="max-w-[56ch] text-base leading-relaxed text-ink">{item}</span>
            </li>
          ))}
        </ul>

        <p data-reveal className="mt-8 max-w-[62ch] text-base leading-relaxed text-ink-soft">
          Every result already records which model and which version produced it. So when
          figures do exist, any report can be tied to the exact version behind it —
          including, looking back, every result that came from the placeholder.
        </p>
      </Section>

      <Section
        id="plans"
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

              <Link
                to={ROUTES.REQUEST_ACCESS}
                className={buttonClass({
                  variant: plan.featured ? "accent" : "secondary",
                  fullWidth: true,
                  className: "mt-6 min-h-11",
                })}
              >
                Request access
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Answers collapsed by default. Five set open as a two-column list ran
          the section to most of a screen of body text that most visitors skim
          past; collapsed, all five questions are legible at one glance and the
          reader opens the one they came for.

          <details>/<summary> rather than a JS accordion: the summary is
          focusable, operable by Enter and Space, and announced with its
          expanded state by screen readers without a line of script — and it
          still works if the bundle fails to load. */}
      <Section
        id="faq"
        tone="light"
        split
        sticky
        title="Common questions"
        lead="If the answer you need is not here, it will be in the reply to your access request — an administrator reads every one."
      >
        <div data-reveal-group>
          {FAQ.map(([q, a]) => (
            <details
              key={q}
              data-reveal
              className="group border-b border-cyprus/12 first:border-t"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold tracking-tight text-ink transition-colors hover:text-cyprus [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="flex-shrink-0 text-accent transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="max-w-[58ch] pb-6 text-base leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
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
          <Link
            to={ROUTES.REQUEST_ACCESS}
            className={buttonClass({
              variant: "accent",
              size: "xl",
              className: "flex-shrink-0",
            })}
          >
            Get started
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
