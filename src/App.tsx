import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ReadingProvider } from './context/ReadingContext';
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

export function App() {
  return (
    <BrowserRouter>
      <ReadingProvider>
        <ScrollRestoration />
        <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
          <div>
            <Header />
            <MobileMenu />
            <TableOfContentsDrawer />
            <AnimatedRoutes />
          </div>
          <Footer />
        </div>
      </ReadingProvider>
    </BrowserRouter>
  );
}

export default App;
