import { useEffect, useState } from 'react';

// Hash routing keeps deep links working on static hosting (GitHub Pages)
// without server rewrites.
export interface Route {
  path: string;
  params: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { path: path || '/', params: new URLSearchParams(query) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function href(path: string, params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) if (v) q.set(k, v);
  const s = q.toString();
  return `#${path}${s ? `?${s}` : ''}`;
}

export function navigate(path: string, params?: Record<string, string | undefined>) {
  window.location.hash = href(path, params).slice(1);
}

/** Update the query without adding history entries. */
export function replaceParams(path: string, params: Record<string, string | undefined>) {
  history.replaceState(null, '', href(path, params));
}
