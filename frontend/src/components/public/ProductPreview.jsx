import React, { useState } from "react";
import { Check, FileText, Layers, PenLine, ScanEye } from "lucide-react";

/**
 * A mock of the reading interface, for the hero.
 *
 * The page can describe what a clinician sees, or it can show them. This shows
 * them: the fundus with the model's evidence drawn over it, an analysis panel
 * beside it, and the report the clinician ends up signing.
 *
 * Everything is drawn, not captured. A real fundus photograph on a public page
 * is patient imaging, and the datasets to hand carry unresolved licensing.
 *
 * NO NUMBER IN HERE IS A CLAIM. There is no accuracy, sensitivity, specificity
 * or confidence value anywhere in this component, and none should be added
 * while the model is unbuilt — a percentage in a product shot reads as a
 * measurement whatever the caption says. States are words: detected, under
 * review, awaiting the clinician. The frame is labelled twice, in the chrome
 * and on the image.
 *
 * Layout: side-by-side on desktop, stacked on mobile in reading order —
 * image, then evidence, then analysis, then the review state. It is never a
 * shrunken desktop dashboard.
 */

// Fixed, not random: a figure that rescatters on each render reads as live data.
//
// Placed the way the disease presents, not scattered evenly. Microaneurysms
// sit in the posterior pole between the disc and the macula; haemorrhages
// follow the arcades; hard exudates ring the macula in the circinate pattern
// that brings these patients in. Nothing sits on the optic disc, where lesions
// do not appear — several did before, which is the sort of detail the audience
// for this page notices first.
const DISC = [122, 150];
const MICROANEURYSMS = [
  [168, 120], [186, 104], [210, 112], [244, 104], [262, 122],
  [176, 186], [198, 202], [232, 196], [258, 184], [276, 148],
  [156, 170], [288, 166], [208, 86], [268, 90],
];
const HAEMORRHAGES = [[190, 108, 5.5], [212, 198, 5], [272, 176, 4.5]];
// Circinate: clustered temporal to the macula rather than spread across the field.
const EXUDATES = [[252, 134, 7, 5], [260, 170, 6, 4.5], [234, 188, 5.5, 4]];
// Cotton-wool spots. Greyish-white and feathered rather than the sharp yellow of
// a hard exudate, and sitting along the arcades — which is where they appear and
// how the two are told apart on sight.
const SOFT_EXUDATES = [[162, 92, 8, 5.5], [286, 198, 7, 5], [141, 196, 6.5, 4.5]];

// The swatch is the mark's own colour, so the key is read off the image rather
// than memorised. SE was teal, which is not a colour a cotton-wool spot comes in.
const LAYERS = [
  ["EX", "#F5F0C8", "Hard exudates"],
  ["HE", "#C0392B", "Haemorrhages"],
  ["MA", "#F4C430", "Microaneurysms"],
  ["SE", "#DDE8E2", "Soft exudates"],
];
const ALL_LAYERS = LAYERS.map(([code]) => code);

const ANALYSIS = [
  { icon: ScanEye, label: "Image analysis", state: "Complete" },
  { icon: Layers, label: "Evidence regions", state: null },
  { icon: PenLine, label: "Model explanation", state: "Overlay ready" },
];

const REPORT = [
  ["Evidence reviewed", true],
  ["Explanation inspected", true],
  ["Clinician interpretation", false],
];

const Fundus = ({ active }) => {
  const has = (code) => active.has(code);
  const any = active.size > 0;
  return (
  <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-labelledby="pv-t pv-d">
    <title id="pv-t">Illustration of a retinal photograph with model evidence marked over it</title>
    <desc id="pv-d">
      A drawing of the back of the eye. Regions of interest are outlined and lesion classes are
      marked in separate colours. Illustrative only — not the output of a diagnostic model.
    </desc>
    <defs>
      <radialGradient id="pvBody" cx="42%" cy="44%" r="72%">
        <stop offset="0%" stopColor="#B4532A" />
        <stop offset="55%" stopColor="#8E3A1C" />
        <stop offset="100%" stopColor="#5A2211" />
      </radialGradient>
      <radialGradient id="pvDisc" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F6D9A8" />
        <stop offset="100%" stopColor="#C89355" />
      </radialGradient>
      <radialGradient id="pvHeat" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00D9C0" stopOpacity="0.38" />
        <stop offset="100%" stopColor="#00D9C0" stopOpacity="0" />
      </radialGradient>
      <clipPath id="pvClip">
        <circle cx="200" cy="150" r="125" />
      </clipPath>
    </defs>

    <rect width="400" height="300" fill="#0B1F1D" />
    <circle cx="200" cy="150" r="125" fill="url(#pvBody)" />

    <g clipPath="url(#pvClip)">
      {/* Vessels as arcades, not spokes.
          A blind reviewer reading for this audience said the tree looked like
          wheel spokes off the disc rather than a fundus. It did. Vessels leave
          the optic disc and sweep in superior and inferior temporal arcades
          that bracket the macula and never cross it; the nasal vessels run
          straighter and shorter. They also taper — the calibre here steps down
          along each branch instead of holding one width to the edge. The
          macula sits temporal to the disc, roughly two disc diameters out,
          slightly below its centre, and is avascular. */}
      <g fill="none" stroke="#7B2418" strokeLinecap="round" opacity="0.94">
        {/* superior temporal arcade */}
        <path d="M134 142 C 168 112, 214 92, 258 92 C 290 92, 312 104, 326 120" strokeWidth="4.6" />
        <path d="M200 97 C 226 74, 254 62, 284 58" strokeWidth="2.4" />
        <path d="M252 92 C 268 76, 282 66, 300 60" strokeWidth="1.9" />
        {/* inferior temporal arcade */}
        <path d="M134 160 C 168 192, 214 214, 258 214 C 292 214, 314 202, 328 186" strokeWidth="4.6" />
        <path d="M204 208 C 228 232, 252 244, 282 250" strokeWidth="2.4" />
        <path d="M256 214 C 272 232, 288 242, 306 248" strokeWidth="1.9" />
        {/* nasal branches — straighter, shorter */}
        <path d="M110 143 C 88 132, 70 124, 52 120" strokeWidth="3.2" />
        <path d="M110 158 C 88 170, 70 180, 54 188" strokeWidth="3.2" />
        <path d="M86 136 C 72 122, 62 112, 50 104" strokeWidth="1.7" />
        <path d="M88 166 C 74 180, 64 192, 54 202" strokeWidth="1.7" />
      </g>

      {/* Macula: temporal to the disc, avascular, with a foveal reflex */}
      <circle cx="222" cy="155" r="34" fill="#6B2A14" opacity="0.42" />
      <circle cx="222" cy="155" r="14" fill="#5E2411" opacity="0.5" />
      <circle cx="222" cy="155" r="2.4" fill="#C98A5E" opacity="0.5" />

      <circle cx="122" cy="150" r="19" fill="url(#pvDisc)" />
      <circle cx="122" cy="150" r="19" fill="none" stroke="#A8763F" strokeWidth="1.2" opacity="0.8" />
      {/* physiological cup, offset within the disc as it sits in life */}
      <ellipse cx="124" cy="150" rx="7.5" ry="9.5" fill="#EBC694" opacity="0.65" />

      {/* Restrained explanation heat, not a rainbow map */}
      <circle cx="250" cy="150" r="52" fill="url(#pvHeat)" />
      <circle cx="200" cy="192" r="40" fill="url(#pvHeat)" />

      <ellipse cx="188" cy="112" rx="13" ry="8.5" fill="#8FD4C8" opacity="0.45" transform="rotate(-20 188 112)" />
      {has("EX") && EXUDATES.map(([cx, cy, rx, ry]) => (
        <ellipse key={`e${cx}${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#F5F0C8" stroke="#E8DF9A" strokeWidth="1" opacity="0.92" />
      ))}
      {has("SE") && SOFT_EXUDATES.map(([cx, cy, rx, ry]) => (
        <g key={`s${cx}${cy}`}>
          {/* Two stacked ellipses: the outer one is the feathered margin that
              separates a cotton-wool spot from a hard exudate at a glance. */}
          <ellipse cx={cx} cy={cy} rx={rx + 2.5} ry={ry + 2} fill="#DDE8E2" opacity="0.28" />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#DDE8E2" opacity="0.62" />
        </g>
      ))}
      {has("HE") && HAEMORRHAGES.map(([cx, cy, r]) => (
        <circle key={`h${cx}${cy}`} cx={cx} cy={cy} r={r} fill="#C0392B" opacity="0.88" />
      ))}
      {has("MA") && MICROANEURYSMS.filter(
        ([cx, cy]) => Math.hypot(cx - DISC[0], cy - DISC[1]) > 30
      ).map(([cx, cy]) => (
        <circle key={`m${cx}${cy}`} cx={cx} cy={cy} r="2.3" fill="#F4C430" />
      ))}

      {/* Region outlines — the marks are the model's, not part of the photograph.
          With every layer switched off the frame is the bare photograph, which
          is the entire point of letting the reader switch them off. */}
      {any && (
      <>
      <g fill="none" stroke="#00D9C0" strokeWidth="1.3" opacity="0.92">
        <rect x="232" y="118" width="46" height="40" rx="3" strokeDasharray="5 4" />
        <rect x="178" y="180" width="46" height="38" rx="3" strokeDasharray="5 4" />
      </g>
      {/* Chips, not bare text. Unbacked, these labels drifted between 1.09:1
          and 4.54:1 depending on whether a lesion happened to sit behind them
          — a label on a retinal image is the last thing to leave unreadable in
          front of the people whose job this is. A solid plate makes the
          contrast deterministic, and 11px clears the small-text floor. */}
      <g fontWeight="700" fontSize="11">
        <rect x="232" y="103" width="22" height="14" rx="3" fill="#052B28" opacity="0.92" />
        <text x="236" y="113.5" fill="#4DE8D2">R1</text>
        <rect x="178" y="165" width="22" height="14" rx="3" fill="#052B28" opacity="0.92" />
        <text x="182" y="175.5" fill="#4DE8D2">R2</text>
      </g>
      </>
      )}
    </g>
    <circle cx="200" cy="150" r="125" fill="none" stroke="#0B1F1D" strokeWidth="3" />
  </svg>
  );
};

/**
 * The layer switches are real.
 *
 * The page claims the model's findings are "layers you control". A static
 * picture of that claim is just an assertion with a screenshot attached — and
 * this audience has been shown a lot of those. Switching a class off and
 * watching the marks leave the photograph is the argument itself, made in the
 * two seconds it takes to click, and it costs a Set in state.
 *
 * It is also the honest demonstration: the interface is real and the reader
 * operates the real thing. Only the findings underneath are simulated, which
 * the frame says twice.
 */
const ProductPreview = () => {
  const [active, setActive] = useState(() => new Set(ALL_LAYERS));

  const toggle = (code) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  return (
  <div className="overflow-hidden rounded-xl border border-white/15 bg-cyprus-dark/85 shadow-modal backdrop-blur-sm">
    {/* Frame header. The label travels with the interface, not the page. */}
    <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
      </span>
      <span className="text-2xs font-medium uppercase tracking-widest text-white/75">
        Reading view
      </span>
      <span className="ml-auto rounded-full bg-warning-bright px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-cyprus-dark">
        Product preview
      </span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-5">
      {/* Image + evidence */}
      <figure className="relative m-0 sm:col-span-3">
        <div className="aspect-[4/3] w-full">
          <Fundus active={active} />
        </div>

        <div className="absolute left-3 top-3 flex items-baseline gap-1.5 rounded-control bg-black/50 px-2 py-1 backdrop-blur-sm">
          <span className="text-2xs font-bold tracking-widest text-white">OD</span>
          <span className="text-2xs text-white/70">right eye</span>
        </div>
        <figcaption className="absolute right-3 top-3 rounded-control bg-black/55 px-2 py-1 text-2xs font-bold uppercase tracking-widest text-warning-bright backdrop-blur-sm">
          Simulated
        </figcaption>

        {/* A real toolbar, not a legend. min-h-6 keeps every control at the
            24px WCAG 2.5.8 floor inside a frame this compact, the swatch goes
            hollow when the layer is off so state never rests on colour alone,
            and aria-pressed carries it to a screen reader. */}
        <div
          role="group"
          aria-label="Evidence layers"
          className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1.5"
        >
          <Layers size={12} className="text-white/75" aria-hidden="true" />
          {LAYERS.map(([code, colour, name]) => {
            const on = active.has(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggle(code)}
                aria-pressed={on}
                title={`${name} — ${on ? "hide" : "show"}`}
                className={`flex min-h-6 items-center gap-1.5 rounded-full px-2 text-2xs font-semibold backdrop-blur-sm transition-colors ${
                  on
                    ? "bg-black/65 text-white"
                    : "bg-black/35 text-white/60 hover:bg-black/55 hover:text-white/85"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full border"
                  style={{
                    background: on ? colour : "transparent",
                    borderColor: colour,
                  }}
                />
                {code}
                <span className="sr-only">{` ${name}`}</span>
              </button>
            );
          })}
        </div>
      </figure>

      {/* Analysis panel, then the report it feeds */}
      <div className="flex flex-col border-t border-white/10 sm:col-span-2 sm:border-l sm:border-t-0">
        <dl className="flex flex-col gap-3 p-4">
          {ANALYSIS.map(({ icon, label, state }) => (
            <div key={label} className="flex items-start gap-2.5">
              {React.createElement(icon, {
                size: 13,
                className: "mt-0.5 flex-shrink-0 text-white/65",
                "aria-hidden": "true",
              })}
              <div className="min-w-0">
                <dt className="text-2xs font-semibold uppercase tracking-widest text-white/75">
                  {label}
                </dt>
                <dd className="mt-0.5 text-xs font-medium text-white/85">{state ?? `${active.size} of ${ALL_LAYERS.length} shown`}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="mt-auto border-t border-white/10 p-4">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-white/75">
            <FileText size={11} aria-hidden="true" />
            Report draft
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {REPORT.map(([line, done]) => (
              <li key={line} className="flex items-center gap-2 text-xs">
                <span
                  aria-hidden="true"
                  className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full ${
                    done ? "bg-success/25 text-success" : "border border-white/30"
                  }`}
                >
                  {done && <Check size={9} strokeWidth={3} />}
                </span>
                <span className={done ? "text-white" : "text-white/75"}>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-2xs leading-relaxed text-white/75">
            Awaiting the reading clinician. The interpretation on the report is theirs.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};

export default ProductPreview;
