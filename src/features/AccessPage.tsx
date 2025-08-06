import { Link } from 'react-router-dom';


export default function AccessPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-4xl font-bold mb-4">AccessPage</h1>
      <p className="text-lg text-muted-foreground mb-8">
       AccessPage
      </p>
      <button>
        <Link to="/">Go to Home</Link>
      </button>
    </div>
  );
}