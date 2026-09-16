import React from "react";

/**
 * The app had six different button geometries for one role — px-6 py-2,
 * px-4 py-2, px-4 py-3, py-3, py-2.5, px-5 py-2.5 — so no two screens agreed
 * on how tall a button is. One component, one geometry per size.
 *
 * `variant` carries meaning, not decoration: exactly one primary per view.
 */
const VARIANTS = {
  primary: "bg-cyprus text-white hover:bg-cyprus-light disabled:hover:bg-cyprus",
  accent: "bg-accent text-white hover:bg-accent/90 disabled:hover:bg-accent",
  secondary:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:hover:bg-white",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:hover:bg-danger",
  ghost: "text-accent hover:bg-accent/10 hover:text-cyprus",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

const Button = React.forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    type = "button",
    fullWidth = false,
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      // Explicit default: an unset type inside a <form> submits it, which is how
      // icon buttons in forms used to fire submissions by accident.
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-control font-medium",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
