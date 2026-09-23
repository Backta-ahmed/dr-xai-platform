import React from "react";

import { buttonClass } from "./buttonClass";

/**
 * The app had six different button geometries for one role — px-6 py-2,
 * px-4 py-2, px-4 py-3, py-3, py-2.5, px-5 py-2.5 — so no two screens agreed
 * on how tall a button is. One component, one geometry per size.
 *
 * `variant` carries meaning, not decoration: exactly one primary per view.
 */
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
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
