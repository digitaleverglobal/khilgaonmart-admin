import { useState, useEffect, useCallback } from "react";
import { purchaseService } from "../services/purchaseService";

export function usePurchases(params = {}) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    purchaseService.getAll(params)
      .then((res) => {
        if (cancelled) return;
        setData(res.data || []);
        setMeta(res.meta || {});
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, JSON.stringify(params)]);

  return { data, meta, loading, error, refetch };
}
