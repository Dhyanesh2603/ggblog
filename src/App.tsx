import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { NovelProvider } from './context/NovelContext';
import { ReadingProvider, useReading } from './context/ReadingContext';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { TableOfContentsDrawer } from './components/TableOfContentsDrawer';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ChapterPage } from './pages/ChapterPage';
import { NovelIndexPage } from './pages/NovelIndexPage';
import { NotesPage } from './pages/NotesPage';
import { ReadingPage } from './pages/ReadingPage';
import { AboutPage } from './pages/AboutPage';
import { WriterStudioPage } from './pages/WriterStudioPage';
import { WriterDashboardPage } from './pages/WriterDashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { WriterProfilePage } from './pages/WriterProfilePage';

// Instant wipe of browser data if ?clearData, ?reset, or ?clear=true is present in URL
if (typeof window !== 'undefined') {
  const search = window.location.search;
  if (
    search.includes('clearData') ||
    search.includes('reset') ||
    search.includes('clear=true')
  ) {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.history.replaceState({}, '', window.location.pathname);
    } catch {}
  }
}

// Auto scroll to top on route change (except when chapter restores position)
function ScrollRestoration() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only scroll to top if not an intra-chapter position
    if (!pathname.startsWith('/novel/chapter-')) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <main key={location.pathname} className="page-fade-in min-h-[75vh]">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<WriterDashboardPage />} />
        <Route path="/studio" element={<WriterStudioPage />} />
        <Route path="/studio/:workId" element={<WriterStudioPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile" element={<WriterProfilePage />} />
        <Route path="/profile/:authorId" element={<WriterProfilePage />} />
        <Route path="/novel" element={<NovelIndexPage />} />
        <Route path="/novel/:slug" element={<ChapterPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </main>
  );
}

function AppLayout() {
  const { isZenMode } = useReading();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      <div>
        {!isZenMode && <Header />}
        {!isZenMode && <MobileMenu />}
        <TableOfContentsDrawer />
        <AnimatedRoutes />
      </div>
      {!isZenMode && <Footer />}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <NovelProvider>
        <ReadingProvider>
          <ScrollRestoration />
          <AppLayout />
        </ReadingProvider>
      </NovelProvider>
    </BrowserRouter>
  );
}

export default App;
