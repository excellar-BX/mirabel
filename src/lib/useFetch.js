import { useCallback, useEffect, useState } from "react";
import api from "./axios";

/**
 * GET a resource. Re-fetches when url/params change; `reload()` re-fetches on demand.
 * Keeps the previous data while a new request is in flight (no flashing skeletons).
 */
export default function useFetch(url, params) {
  const paramsJson = JSON.stringify(params || {});
  const [nonce, setNonce] = useState(0);
  const requestKey = `${url}?${paramsJson}#${nonce}`;
  const [state, setState] = useState({ key: null, data: undefined, error: null });

  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    api
      .get(url, { params: JSON.parse(paramsJson) })
      .then((res) => alive && setState({ key: requestKey, data: res.data, error: null }))
      .catch(
        (err) =>
          alive &&
          setState((prev) => ({
            key: requestKey,
            data: prev.data,
            error: err.response?.data?.message || "Could not load data",
          }))
      );
    return () => {
      alive = false;
    };
  }, [url, paramsJson, requestKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: state.data,
    error: state.key === requestKey ? state.error : null,
    loading: state.key !== requestKey,
    reload,
  };
}
