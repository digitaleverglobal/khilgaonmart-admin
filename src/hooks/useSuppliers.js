import { useState, useEffect, useCallback } from "react";
import { supplierService, supplierHistoryService } from "../services/supplierService";

function useResourceList(fetchFn, params = {}) {
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
    fetchFn(params)
      .then((res) => {
        if (cancelled) return;
        setData(res.data || []);
        setMeta(res.meta || {});
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, JSON.stringify(params)]);

  return { data, meta, loading, error, refetch };
}

export function useSuppliers(params = {}) {
  return useResourceList(supplierService.getAll, params);
}

export function useSupplierAllList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supplierService.getAllList()
      .then((res) => {
        if (!cancelled) setData(res.data || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { data, loading, refetch };
}

export function useSupplierHistory(params = {}) {
  return useResourceList(supplierHistoryService.getAll, params);
}
