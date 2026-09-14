import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../api/axios";

/**
 * Load data on mount and whenever `deps` change.
 *
 * Replaces the loading/error/retry block that was duplicated across ten pages,
 * and fixes two problems that pattern had:
 *
 * 1. No cancellation. Paging quickly meant an earlier response could resolve
 *    after a later one and overwrite fresh data with stale rows, and a response
 *    arriving after unmount set state on a dead component.
 * 2. A synchronous setState in the effect body, which forces an immediate
 *    second render on every mount.
 *
 * `fetcher` receives nothing and returns a promise of the data to store.
 * It must be stable — wrap it in useCallback in the calling component.
 */
export function useFetch(fetcher, deps = [], fallbackMessage) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err, fallbackMessage));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `fetcher` is intentionally excluded: callers pass an inline useCallback
    // whose own deps are already listed in `deps`, so including it here would
    // just re-run the effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken, fallbackMessage]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { data, loading, error, reload };
}
