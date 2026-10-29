import { useState, useEffect, useCallback, useRef } from "react";
import {
  productService,
  categoryService,
  subcategoryService,
  childcategoryService,
  brandService,
  colorService,
  attributeService,
  reviewService,
} from "../services/productService";

function useResourceList(fetchFn, params = {}) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const hasLoadedDataRef = useRef(false);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchFn(params)
      .then((res) => {
        setData(res.data || []);
        setMeta(res.meta || {});
        hasLoadedDataRef.current = true;
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError((prev) => (hasLoadedDataRef.current ? prev : err.message));
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [tick, JSON.stringify(params)]);

  return { data, meta, loading, error, refetch };
}

export function useProducts(params = {}) {
  return useResourceList(productService.getAll, params);
}

export function useCategories(params = {}) {
  return useResourceList(categoryService.getAll, params);
}

export function useSubcategories(params = {}) {
  return useResourceList(subcategoryService.getAll, params);
}

export function useChildcategories(params = {}) {
  return useResourceList(childcategoryService.getAll, params);
}

export function useBrands(params = {}) {
  return useResourceList(brandService.getAll, params);
}

export function useColors(params = {}) {
  return useResourceList(colorService.getAll, params);
}

export function useAttributes(params = {}) {
  return useResourceList(attributeService.getAll, params);
}

export function useReviews(params = {}) {
  return useResourceList(reviewService.getAll, params);
}
