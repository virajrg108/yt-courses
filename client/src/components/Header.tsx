import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Play, BookOpen, Github } from 'lucide-react';

export default function Header() {
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header 
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
        ${isScrolled ? 'shadow-sm' : ''}`}
    >
      <div className="container flex h-14 items-center mx-auto">
        {/* Logo */}
        <button
          onClick={() => setLocation('/')}
          className="mr-4 flex items-center gap-2 font-semibold transition-colors hover:opacity-80"
        >
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
            <Play className="h-4 w-4 ml-0.5" />
          </div>
          <span>YT Courses</span>
        </button>
        
        {/* Navigation */}
        <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium flex-1">
          <button
            onClick={() => setLocation('/')}
            className={`transition-colors hover:text-foreground/80 ${
              location === '/' ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </span>
          </button>
        </nav>
        
        {/* GitHub link */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-foreground/60 transition-colors hover:text-foreground"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </header>
  );
}