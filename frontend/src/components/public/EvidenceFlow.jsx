import React from "react";
import { ArrowRight, Eye, Layers, Stethoscope } from "lucide-react";

/**
 * The product's argument, as three steps rather than three paragraphs:
 * the image, the model's evidence over it, and the clinician's decision.
 *
 * The third panel is deliberately the one that resolves. A screening product
 * would end at the model's output; here the clinician is the endpoint, and the
 * diagram should say so before the prose does.
 */

const Retina = ({ withOverlay = false, dimmed = false }) => (
  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id={`ef-body-${withOverlay ? "o" : "p"}`} cx="42%" cy="44%" r="72%">
        <stop offset="0%" stopColor="#B4532A" />
        <stop offset="60%" stopColor="#8E3A1C" />
        <stop offset="100%" stopColor="#5A2211" />
      </radialGradient>
      <clipPath id={`ef-clip-${withOverlay ? "o" : "p"}`}>
        <circle cx="60" cy="60" r="48" />
      </clipPath>
    </defs>
    <rect width="120" height="120" rx="8" fill="#0B1F1D" />
    <circle cx="60" cy="60" r="48" fill={`url(#ef-body-${withOverlay ? "o" : "p"})`} opacity={dimmed ? 0.5 : 1} />
    <g clipPath={`url(#ef-clip-${withOverlay ? "o" : "p"})`} opacity={dimmed ? 0.5 : 1}>
      <g fill="none" stroke="#7B2418" strokeLinecap="round">
        <path d="M36 54 C 52 46, 70 36, 94 24" strokeWidth="2.6" />
        <path d="M36 66 C 54 76, 72 88, 96 104" strokeWidth="2.6" />
        <path d="M37 58 C 58 58, 80 56, 106 53" strokeWidth="1.8" />
        <path d="M37 62 C 56 64, 78 68, 104 74" strokeWidth="1.8" />
      </g>
      <circle cx="70" cy="61" r="12" fill="#6B2A14" opacity="0.5" />
      <circle cx="36" cy="60" r="7.5" fill="#E0B478" />
      {withOverlay && (
        <>
          <ellipse cx="72" cy="46" rx="5" ry="3.4" fill="#F5F0C8" stroke="#E8DF9A" strokeWidth="0.7" />
          <ellipse cx="86" cy="74" rx="4" ry="3" fill="#F5F0C8" stroke="#E8DF9A" strokeWidth="0.7" />
          <circle cx="56" cy="52" r="3.4" fill="#C0392B" />
          <circle cx="84" cy="60" r="2.8" fill="#C0392B" />
          {[[48, 42], [64, 38], [92, 50], [52, 74], [78, 84], [40, 70], [96, 66]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#F4C430" />
          ))}
          <circle cx="72" cy="46" r="9" fill="none" stroke="#00D9C0" strokeWidth="0.9" opacity="0.9" />
          <circle cx="56" cy="52" r="8" fill="none" stroke="#00D9C0" strokeWidth="0.9" opacity="0.9" />
        </>
      )}
    </g>
  </svg>
);

const Decision = () => (
  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
    <rect width="120" height="120" rx="8" fill="#FFFFFF" />
    <rect x="14" y="18" width="58" height="6" rx="3" fill="#0F241F" opacity="0.85" />
    <rect x="14" y="32" width="92" height="4" rx="2" fill="#3D4F49" opacity="0.35" />
    <rect x="14" y="42" width="78" height="4" rx="2" fill="#3D4F49" opacity="0.35" />
    <rect x="14" y="58" width="92" height="26" rx="5" fill="#F0EDE4" />
    <rect x="22" y="66" width="44" height="4" rx="2" fill="#004741" opacity="0.55" />
    <rect x="22" y="74" width="62" height="4" rx="2" fill="#3D4F49" opacity="0.3" />
    <rect x="14" y="94" width="40" height="12" rx="6" fill="#004741" />
    <rect x="60" y="94" width="34" height="12" rx="6" fill="none" stroke="#004741" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

const STAGES = [
  {
    icon: Eye,
    label: "The photograph",
    body: "The fundus image as captured, at the zoom you choose.",
    visual: <Retina />,
  },
  {
    icon: Layers,
    label: "The model's evidence",
    body: "Lesions marked in place, each class its own layer, toggled as you read.",
    visual: <Retina withOverlay />,
  },
  {
    icon: Stethoscope,
    label: "Your judgment",
    body: "You confirm or overrule. Your reading is what the report carries.",
    visual: <Decision />,
  },
];

const EvidenceFlow = () => (
  <ol data-reveal-group className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-0">
    {STAGES.map(({ icon, label, body, visual }, i) => (
      <li
        key={label}
        data-reveal
        className={`relative flex flex-col ${i > 0 ? "sm:pl-7" : ""} ${
          i < STAGES.length - 1 ? "sm:pr-7" : ""
        }`}
      >
        {/* The arrow lives between panels on desktop and disappears when they
            stack, where reading order already carries the sequence. */}
        {i < STAGES.length - 1 && (
          <span
            aria-hidden="true"
            className="absolute -right-3 top-[68px] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-cyprus text-white/70 sm:flex"
          >
            <ArrowRight size={12} />
          </span>
        )}

        <div className="aspect-square w-full overflow-hidden rounded-lg border border-white/12">
          {visual}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {React.createElement(icon, { size: 15, className: "text-white/60", "aria-hidden": "true" })}
          <h3 className="text-md font-semibold text-white">{label}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/80">{body}</p>
      </li>
    ))}
  </ol>
);

export default EvidenceFlow;
