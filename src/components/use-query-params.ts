import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useHistory } from "react-router";

export function useQueryParam<T>(name: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const history = useHistory();

  const params = new URLSearchParams(history.location.search);
  const currentUrlValue = params.has(name) && (params.get(name) as any);

  const [query, setQuery] = useState<typeof defaultValue>(currentUrlValue || defaultValue);

  useEffect(() => {
    const params = new URLSearchParams(history.location.search);
    const currentUrlValue = (params.has(name) && (params.get(name) as any)) || defaultValue;

    if (query && currentUrlValue !== query) {
      params.set(name, String(query));
      history.push({ search: params.toString() });
    }
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams(history.location.search);
    const currentUrlValue = (params.has(name) && (params.get(name) as any)) || defaultValue;

    if (currentUrlValue !== query) {
      setQuery(currentUrlValue);
    }
  }, [history.location.search, history]);

  return [query, setQuery];
}
