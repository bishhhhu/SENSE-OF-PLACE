import { lazy, Suspense, useEffect } from 'react';
import { useRoute } from './lib/router';
import Landing from './pages/Landing';
import Architecture from './pages/Architecture';
import { Loader } from './ui/Loader';

// The 3D experience (three.js, R3F) is split out so the exhibition pages load fast.
const Experience = lazy(() => import('./pages/Experience'));

export default function App() {
  const route = useRoute();

  useEffect(() => {
    if (route.path !== '/experience') window.scrollTo({ top: 0 });
    const el = route.params.get('section');
    if (el) requestAnimationFrame(() => document.getElementById(el)?.scrollIntoView({ behavior: 'smooth' }));
  }, [route.path, route.params]);

  if (route.path === '/experience')
    return (
      <Suspense fallback={<Loader label="Loading the 3D reconstruction" />}>
        <Experience params={route.params} />
      </Suspense>
    );
  if (route.path === '/architecture') return <Architecture />;
  return <Landing />;
}
