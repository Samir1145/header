// src/features/NotFound.tsx
import { Link } from 'react-router-dom';


export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button>
        <Link to="/">Go to Home</Link>
      </button>
    </div>
  );
}