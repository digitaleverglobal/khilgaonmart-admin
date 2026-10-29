import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboardService";

export function useDashboard({ fromDate, toDate } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate)   params.toDate   = toDate;
      const res = await dashboardService.getStats(params);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
