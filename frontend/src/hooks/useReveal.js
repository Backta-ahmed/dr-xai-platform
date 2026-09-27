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
 *   3. A watchdog clears the inline style on any target that is on screen and
 *      still transparent, so a ScrollTrigger that never fires cannot leave
 *      content invisible. It only ever touches what the reader can already
 *      see. Cleanup reverts through the same path.
 *
 * Under `prefers-reduced-motion` nothing is hidden and nothing animates.
 */

// How often the watchdog looks, and how long a target must stay stranded
// before it is rescued. Comfortably longer than one entrance (0.55s) plus the
// longest stagger on the page, so nothing mid-animation is ever snapped.
const PATROL_MS = 1500;

export const useReveal = (options = {}) => {
  const scope = useRef(null);
  const { selector = "[data-reveal]", y = 22, duration = 0.55, stagger = 0.07 } = options;

  useEffect(() => {
    const root = scope.current;
    if (!root) return undefined;

    const targets = gsap.utils.toArray(root.querySelectorAll(selector));
    if (targets.length === 0) return undefined;

    // Kill before clearing. clearProps alone strips the inline style but leaves
    // the tween running, and the next tick writes the same value back —
    // observed leaving six hero elements pinned at opacity 0.54 with the
    // watchdog firing and changing nothing.
    const clear = (els) => {
      if (!els.length) return;
      gsap.killTweensOf(els);
      gsap.set(els, { clearProps: "opacity,transform,visibility" });
    };
    const rescue = () => clear(targets);

    // A target is stranded if it is on screen and still transparent. Anything
    // below the fold is deliberately left alone.
    //
    // This used to be a single timer that cleared every target four seconds
    // after mount, on-screen or not. That made the whole page reveal itself on
    // a stopwatch: scroll slowly and you passed four seconds before arriving
    // anywhere, so every section was already showing when you got to it, and
    // only a fast scroll outran it.
    const onScreen = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    const stranded = () =>
      targets.filter(
        (el) => onScreen(el) && Number(gsap.getProperty(el, "opacity")) < 0.99
      );

    // Two strikes. An element waiting its turn in a stagger is briefly on
    // screen and transparent through no fault of its own, and must not be
    // snapped visible ahead of its group. One interval is longer than any
    // entrance plus its stagger, so anything still stranded on the second look
    // is genuinely stuck — whether ScrollTrigger never fired, or a hidden tab
    // suspended requestAnimationFrame and froze a tween part-way.
    let suspects = [];
    const patrol = () => {
      const now = stranded();
      clear(now.filter((el) => suspects.includes(el)));
      suspects = now;
    };
    const failsafe = window.setInterval(patrol, PATROL_MS);

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
              // The element's top reaching 82% down the viewport, so it has
              // genuinely started to arrive rather than being animated while
              // still a screen away.
              start: "top 82%",
              once: true,
            },
          });
        });
      });

      // Reduced motion: no tween, and crucially nothing is ever set to zero.
    }, root);

    return () => {
      window.clearInterval(failsafe);
      ctx.revert();
      // revert() restores what GSAP recorded, but an interrupted context has
      // been seen to leave a target mid-tween. Clearing unconditionally costs
      // nothing and removes the one failure mode that matters here.
      rescue();
    };
  }, [selector, y, duration, stagger]);

  return scope;
};
