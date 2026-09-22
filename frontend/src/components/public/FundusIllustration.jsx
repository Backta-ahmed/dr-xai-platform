import React from "react";

/**
 * Hero illustration: a fundus with the model's findings drawn over it.
 *
 * Drawn rather than photographed, for two reasons. A real fundus photograph on
 * a public page is patient imaging, and the datasets available here carry
 * unresolved licensing. More importantly, no model exists yet — a screenshot of
 * real overlays would be a picture of a capability the platform does not have.
 * A diagram states the idea without claiming the output, which is the same line
 * the rest of this page walks.
 *
 * The lesion classes are the four the segmentation model will produce, in the
 * colours the clinical UI uses for them. Everything else stays inside the
 * frozen palette.
 */

// Deterministic scatter. Random placement on every render made the same figure
// look like live data, which is exactly the impression this must not give.
const MICROANEURYSMS = [
  [176, 128], [212, 104], [268, 118], [304, 152], [150, 178],
  [330, 196], [196, 232], [286, 244], [242, 88], [138, 146],
  [318, 122], [224, 268], [172, 206], [300, 208], [258, 166],
];

const HAEMORRHAGES = [
  [200, 150, 7], [292, 182, 6], [164, 234, 5.5], [316, 238, 5],
];

const EXUDATES = [
  [236, 132, 9, 6], [270, 210, 7, 5], [190, 190, 6.5, 4.5],
];

const LEGEND = [
  ["MA", "Microaneurysms", "#F4C430"],
  ["HE", "Haemorrhages", "#C0392B"],
  ["EX", "Hard exudates", "#F5F0C8"],
  ["SE", "Soft exudates", "#8FD4C8"],
];

const FundusIllustration = ({ className = "" }) => (
  <figure className={className}>
    <svg
      viewBox="0 0 480 360"
      className="w-full rounded-card"
      role="img"
      aria-labelledby="fundus-illus-title fundus-illus-desc"
    >
      <title id="fundus-illus-title">
        Illustration of a retinal fundus with lesions marked
      </title>
      <desc id="fundus-illus-desc">
        A diagram of the back of the eye. Microaneurysms, haemorrhages and hard
        exudates are marked in separate colours, beside a panel reading grade 2,
        moderate. Illustrative only — not output from a diagnostic model.
      </desc>

      <defs>
        {/* Retinal background: brighter at the disc, falling off to the periphery */}
        <radialGradient id="fundusBody" cx="42%" cy="44%" r="72%">
          <stop offset="0%" stopColor="#B4532A" />
          <stop offset="55%" stopColor="#8E3A1C" />
          <stop offset="100%" stopColor="#5A2211" />
        </radialGradient>
        <radialGradient id="discGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F6D9A8" />
          <stop offset="70%" stopColor="#E0B478" />
          <stop offset="100%" stopColor="#C89355" />
        </radialGradient>
        <clipPath id="fundusClip">
          <circle cx="240" cy="180" r="150" />
        </clipPath>
      </defs>

      <rect width="480" height="360" rx="12" fill="#0B1F1D" />
      <circle cx="240" cy="180" r="150" fill="url(#fundusBody)" />

      <g clipPath="url(#fundusClip)">
        {/* Vessel tree, arcading above and below the macula as it does in life */}
        <g
          fill="none"
          stroke="#7B2418"
          strokeLinecap="round"
          opacity="0.92"
        >
          <path d="M150 168 C 190 150, 236 128, 300 96" strokeWidth="5" />
          <path d="M150 190 C 192 210, 240 234, 302 268" strokeWidth="5" />
          <path d="M152 176 C 200 176, 250 172, 330 166" strokeWidth="3.5" />
          <path d="M150 182 C 196 186, 248 196, 328 212" strokeWidth="3.5" />
          <path d="M196 149 C 214 132, 228 118, 236 98" strokeWidth="2.4" />
          <path d="M232 137 C 258 130, 282 128, 316 130" strokeWidth="2" />
          <path d="M204 212 C 220 232, 232 248, 238 266" strokeWidth="2.4" />
          <path d="M246 226 C 274 232, 296 240, 322 252" strokeWidth="2" />
          <path d="M176 160 C 160 142, 146 128, 132 118" strokeWidth="2" />
          <path d="M178 200 C 160 218, 146 234, 134 248" strokeWidth="2" />
        </g>

        {/* Macula — darker, avascular, temporal to the disc */}
        <circle cx="258" cy="182" r="34" fill="#6B2A14" opacity="0.55" />
        <circle cx="258" cy="182" r="5" fill="#57200F" opacity="0.7" />

        {/* Optic disc */}
        <circle cx="150" cy="179" r="22" fill="url(#discGlow)" />
        <circle cx="150" cy="179" r="22" fill="none" stroke="#A8763F" strokeWidth="1.5" />
        <ellipse cx="150" cy="179" rx="9" ry="11" fill="#D9AE78" opacity="0.75" />

        {/* ---- findings ---- */}

        {/* SE: soft exudate, a single cotton-wool patch with a soft edge */}
        <ellipse
          cx="208"
          cy="120"
          rx="16"
          ry="11"
          fill="#8FD4C8"
          opacity="0.5"
          transform="rotate(-18 208 120)"
        />
        <ellipse
          cx="208"
          cy="120"
          rx="16"
          ry="11"
          fill="none"
          stroke="#8FD4C8"
          strokeWidth="1.5"
          strokeDasharray="3 2.5"
          transform="rotate(-18 208 120)"
        />

        {/* EX: hard exudates, sharp-edged and clustered near the macula */}
        {EXUDATES.map(([cx, cy, rx, ry]) => (
          <ellipse
            key={`ex-${cx}-${cy}`}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="#F5F0C8"
            stroke="#E8DF9A"
            strokeWidth="1.2"
            opacity="0.92"
          />
        ))}

        {/* HE: blot haemorrhages */}
        {HAEMORRHAGES.map(([cx, cy, r]) => (
          <circle key={`he-${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#C0392B" opacity="0.88" />
        ))}

        {/* MA: microaneurysms, the earliest sign and the hardest to see */}
        {MICROANEURYSMS.map(([cx, cy]) => (
          <circle key={`ma-${cx}-${cy}`} cx={cx} cy={cy} r="2.6" fill="#F4C430" />
        ))}

        {/* Detection rings over two findings, to say plainly that these marks are
            the model's, not part of the photograph */}
        <circle cx="200" cy="150" r="15" fill="none" stroke="#00D9C0" strokeWidth="1.6" opacity="0.85" />
        <circle cx="236" cy="132" r="17" fill="none" stroke="#00D9C0" strokeWidth="1.6" opacity="0.85" />
      </g>

      <circle cx="240" cy="180" r="150" fill="none" stroke="#0B1F1D" strokeWidth="3" />

      {/* Grade panel, echoing the one in the reading view */}
      <g transform="translate(316, 40)">
        <rect width="132" height="62" rx="8" fill="#FFFFFF" opacity="0.97" />
        <text x="12" y="20" fontSize="9" fontWeight="600" fill="#6B7280" letterSpacing="0.8">
          MODEL GRADE
        </text>
        <text x="12" y="41" fontSize="19" fontWeight="700" fill="#7A3E00">
          Stage 2
        </text>
        <text x="12" y="54" fontSize="10" fill="#7A3E00">
          Moderate DR
        </text>
      </g>

      {/* Legend */}
      <g transform="translate(20, 292)">
        {LEGEND.map(([code, label, colour], i) => (
          <g key={code} transform={`translate(${i * 112}, 0)`}>
            <circle cx="6" cy="6" r="5" fill={colour} />
            <text x="17" y="9" fontSize="10" fontWeight="700" fill="#E8E4DA">
              {code}
            </text>
            <text x="17" y="22" fontSize="8.5" fill="#B7B2A6">
              {label}
            </text>
          </g>
        ))}
      </g>
    </svg>
    <figcaption className="mt-2 text-xs text-gray-600">
      Illustration. Lesion classes the segmentation model will mark: EX, HE, MA, SE.
      No diagnostic model is connected yet.
    </figcaption>
  </figure>
);

export default FundusIllustration;
