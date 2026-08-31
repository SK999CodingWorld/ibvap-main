import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <h1 className="text-6xl font-bold text-slate-700 mb-4">404</h1>
    <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
    <p className="text-slate-400 mb-6">The page you are looking for doesn't exist or is still under construction.</p>
    <Link to="/command-center">
      <Button>Return to Command Center</Button>
    </Link>
  </div>
);
