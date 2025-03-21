import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import Header from '../components/Header';

export default function NotFound() {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-10 flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-7xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <button 
            onClick={() => setLocation('/')}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}