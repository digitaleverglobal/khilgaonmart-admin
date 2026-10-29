import { useRef } from "react";

// Keep the key through network failures and reloads; only success retires it.
export function useCheckoutSession() {
  const session = useRef(null);
  const submitting = useRef(false);
  function getKey(phone) {
    const scope = `checkout:v1:${window.location.pathname}:${phone}`;
    if (session.current?.scope === scope) return session.current.key;
    let key;
    try { key = sessionStorage.getItem(scope); } catch {}
    key ||= Array.from(crypto.getRandomValues(new Uint8Array(16)),
      (byte) => byte.toString(16).padStart(2, "0")).join("");
    session.current = { scope, key };
    try { sessionStorage.setItem(scope, key); } catch {}
    return key;
  }
  function complete() {
    if (session.current) {
      try { sessionStorage.removeItem(session.current.scope); } catch {}
    }
    session.current = null;
  }
  return { getKey, complete, submitting };
}
