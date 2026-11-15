import { Component, type ReactNode } from 'react';

/** Catches load/render failures and offers a reload instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    const msg = String((error as Error)?.message ?? error);
    // A stale cached page asking for files from an older deploy: reload once.
    if (/dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg)) {
      try {
        const last = Number(sessionStorage.getItem('jaali-chunk-reload') || 0);
        if (Date.now() - last > 30000) {
          sessionStorage.setItem('jaali-chunk-reload', String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-ivory p-6 text-center">
        <div className="max-w-md">
          <p className="label">Something went wrong</p>
          <h1 className="mt-3 font-serif text-4xl">This page didn’t load.</h1>
          <p className="mt-3 text-charcoal-soft">The site may have just been updated. Reloading fetches the latest version.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
            <a className="btn-outline" href="#/" onClick={() => setTimeout(() => window.location.reload(), 0)}>
              Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
