import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-triggered entrance animation, built so it cannot hide content.
 *
 * The sign-in screen once rendered fully invisible because a GSAP tween
 * animated `from: { opacity: 0 }` — that parks the element at zero and depends
 * on the tween completing to reveal it. Under StrictMode's doubled effects the
 * context revert could strand it there, with no error to debug from. Applying
 * that same pattern down a marketing page, where most targets sit below the
 * fold behind a ScrollTrigger that may never fire, would be the same bug with
 * more places to hide.
 *
 * Three rules make it safe:
 *
 *   1. The resting state in CSS is visible. Nothing is hidden by a stylesheet,
 *      so if this module fails to load or JavaScript is off, the page reads
 *      normally.
 *   2. Elements are hidden from JavaScript, immediately before the tween that
 *      reveals them — never earlier.
 *   3. A watchdog clears every inline style after FAILSAFE_MS whatever
 *      happened, so a ScrollTrigger that never fires cannot leave content
 *      invisible. Cleanup reverts through the same path.
 *
 * Under `prefers-reduced-motion` nothing is hidden and nothing animates.
 */

const FAILSAFE_MS = 4000;

export const useReveal = (options = {}) => {
  const scope = useRef(null);
  const { selector = "[data-reveal]", y = 22, duration = 0.55, stagger = 0.07 } = options;

  useEffect(() => {
    const root = scope.current;
    if (!root) return undefined;

    const targets = gsap.utils.toArray(root.querySelectorAll(selector));
    if (targets.length === 0) return undefined;

    // The watchdog is armed before anything is hidden, so every early return
    // below still ends with the content visible.
    //
    // It kills the tweens first. clearProps alone strips the inline style but
    // leaves the tween running, and the next tick writes the same value back —
    // observed leaving six hero elements pinned at opacity 0.54 with the
    // watchdog firing and changing nothing. A hidden tab suspends
    // requestAnimationFrame, so a tween started on load can freeze part-way and
    // never complete; setTimeout still fires there, which is why the rescue
    // hangs off a timer rather than off GSAP.
    const rescue = () => {
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "opacity,transform,visibility" });
    };
    const failsafe = window.setTimeout(rescue, FAILSAFE_MS);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        targets.forEach((el) => {
          // Grouped by the element's own data-reveal value so a row of cards
          // staggers together rather than each animating on its own trigger.
          const trigger = el.closest("[data-reveal-group]") ?? el;
          gsap.set(el, { opacity: 0, y });
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration,
            ease: "power2.out",
            stagger,
            scrollTrigger: {
              trigger,
              start: "top 85%",
              once: true,
            },
          });
        });
      });

      // Reduced motion: no tween, and crucially nothing is ever set to zero.
    }, root);

    return () => {
      window.clearTimeout(failsafe);
      ctx.revert();
      // revert() restores what GSAP recorded, but an interrupted context has
      // been seen to leave a target mid-tween. Clearing unconditionally costs
      // nothing and removes the one failure mode that matters here.
      rescue();
    };
  }, [selector, y, duration, stagger]);

  return scope;
};
