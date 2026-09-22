import React from "react";
import { Check, Layers, PenLine } from "lucide-react";

/**
 * A mock of the reading interface, for the hero.
 *
 * The page could describe what a clinician sees, or it could show them. This
 * shows them: the fundus on the left with the model's findings drawn over it,
 * the grade and the clinician's own reading on the right.
 *
 * Everything here is drawn, not captured. A real fundus photograph on a public
 * page is patient imaging, and the datasets to hand carry unresolved
 * licensing. It is labelled a preview, in the frame, because no diagnostic
 * model is connected yet — this is the interface, not its output.
 *
 * No performance figure appears anywhere in it. The confidence meter is shown
 * because the interface has one, at a value that illustrates the control; it is
 * not a claim about how well anything performs, and the page's Evidence section
 * states plainly that no such figures exist yet.
 */

// Fixed, not random: a figure that rescatters on each render reads as live data.
const MICROANEURYSMS = [
  [150, 108], [186, 88], [232, 100], [262, 128], [128, 150],
  [282, 166], [168, 196], [246, 206], [206, 76], [118, 124],
  [272, 104], [192, 226], [146, 174], [258, 176],
];
const HAEMORRHAGES = [
  [172, 128, 6], [250, 154, 5], [140, 198, 4.5],
];
const EXUDATES = [
  [202, 112, 8, 5.5], [232, 178, 6, 4.5], [162, 162, 5.5, 4],
];

const LAYERS = [
  ["EX", "#F5F0C8"],
  ["HE", "#C0392B"],
  ["MA", "#F4C430"],
  ["SE", "#8FD4C8"],
];

const Fundus = () => (
  <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-labelledby="pv-t pv-d">
    <title id="pv-t">Illustration of a retinal photograph with the model&rsquo;s findings marked</title>
    <desc id="pv-d">
      A drawing of the back of the eye. Microaneurysms, haemorrhages and hard exudates are
      marked in separate colours. Illustrative only — not output from a diagnostic model.
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
      <clipPath id="pvClip">
        <circle cx="200" cy="150" r="125" />
      </clipPath>
    </defs>

    <rect width="400" height="300" fill="#0B1F1D" />
    <circle cx="200" cy="150" r="125" fill="url(#pvBody)" />

    <g clipPath="url(#pvClip)">
      <g fill="none" stroke="#7B2418" strokeLinecap="round" opacity="0.92">
        <path d="M122 140 C 158 124, 198 104, 254 76" strokeWidth="4.5" />
        <path d="M122 160 C 160 178, 202 200, 256 230" strokeWidth="4.5" />
        <path d="M124 148 C 168 148, 212 144, 284 138" strokeWidth="3" />
        <path d="M124 154 C 164 158, 210 166, 282 180" strokeWidth="3" />
        <path d="M164 126 C 180 110, 192 98, 200 80" strokeWidth="2" />
        <path d="M196 116 C 220 110, 240 108, 270 110" strokeWidth="1.8" />
        <path d="M170 182 C 184 200, 196 214, 202 230" strokeWidth="2" />
        <path d="M208 194 C 234 200, 254 208, 276 218" strokeWidth="1.8" />
      </g>

      <circle cx="218" cy="152" r="30" fill="#6B2A14" opacity="0.5" />
      <circle cx="122" cy="150" r="19" fill="url(#pvDisc)" />
      <ellipse cx="122" cy="150" rx="8" ry="10" fill="#D9AE78" opacity="0.7" />

      <ellipse cx="176" cy="98" rx="14" ry="9" fill="#8FD4C8" opacity="0.45" transform="rotate(-18 176 98)" />
      {EXUDATES.map(([cx, cy, rx, ry]) => (
        <ellipse key={`e${cx}${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#F5F0C8" stroke="#E8DF9A" strokeWidth="1" opacity="0.92" />
      ))}
      {HAEMORRHAGES.map(([cx, cy, r]) => (
        <circle key={`h${cx}${cy}`} cx={cx} cy={cy} r={r} fill="#C0392B" opacity="0.88" />
      ))}
      {MICROANEURYSMS.map(([cx, cy]) => (
        <circle key={`m${cx}${cy}`} cx={cx} cy={cy} r="2.3" fill="#F4C430" />
      ))}

      {/* Detection rings, so the marks read as the model's rather than as part
          of the photograph. */}
      <circle cx="172" cy="128" r="13" fill="none" stroke="#00D9C0" strokeWidth="1.4" opacity="0.9" />
      <circle cx="202" cy="112" r="15" fill="none" stroke="#00D9C0" strokeWidth="1.4" opacity="0.9" />
    </g>
    <circle cx="200" cy="150" r="125" fill="none" stroke="#0B1F1D" strokeWidth="3" />
  </svg>
);

const ProductPreview = () => (
  <figure className="overflow-hidden rounded-xl border border-white/15 bg-cyprus-dark/80 shadow-raised backdrop-blur-sm">
    {/* Frame header — the label lives here so it travels with the image. */}
    <figcaption className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
      </span>
      <span className="text-2xs font-medium uppercase tracking-widest text-white/55">
        Reading view
      </span>
      <span className="ml-auto rounded-full border border-white/25 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-white/70">
        Product preview
      </span>
    </figcaption>

    <div className="grid grid-cols-1 sm:grid-cols-5">
      {/* Image side */}
      <div className="relative sm:col-span-3">
        <div className="aspect-[4/3] w-full">
          <Fundus />
        </div>

        <div className="absolute left-3 top-3 flex items-baseline gap-1.5 rounded-control bg-black/45 px-2 py-1 backdrop-blur-sm">
          <span className="text-2xs font-bold tracking-widest text-white">OD</span>
          <span className="text-2xs text-white/70">right eye</span>
        </div>

        {/* Layer toggles — the control that makes the evidence inspectable. */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1.5">
          <Layers size={12} className="text-white/55" aria-hidden="true" />
          {LAYERS.map(([code, colour]) => (
            <span
              key={code}
              className="flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-2xs font-semibold text-white/85 backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: colour }} />
              {code}
            </span>
          ))}
        </div>
      </div>

      {/* Analysis side */}
      <div className="flex flex-col gap-4 border-t border-white/10 p-4 sm:col-span-2 sm:border-l sm:border-t-0">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-widest text-white/50">
            Model grade
          </p>
          <p className="mt-1 text-xl font-bold leading-none text-white">Stage 2</p>
          <p className="mt-1 text-xs text-white/65">Moderate DR · ICDR</p>
        </div>

        <div>
          <p className="text-2xs font-semibold uppercase tracking-widest text-white/50">
            Confidence
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <span className="block h-full w-[78%] rounded-full bg-warning" />
            </span>
            <span className="text-xs font-semibold text-white/85">78%</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3.5">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-white/50">
            <PenLine size={11} aria-hidden="true" />
            Your reading
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/75">
            Confirmed. Exudates temporal to the macula, no IRMA.
          </p>
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-1 text-2xs font-semibold text-white/85">
            <Check size={11} className="text-success" aria-hidden="true" />
            Signed by the reading clinician
          </p>
        </div>
      </div>
    </div>
  </figure>
);

export default ProductPreview;
