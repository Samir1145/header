import { useLoginUrl } from '@/components/useLoginUrl';

export default function FramePage14() {
  const matchedTab = useLoginUrl();
  const loginUrl = matchedTab || null;

  return (
    <div className="w-full h-full">
      {loginUrl ? (
        <iframe
          src={loginUrl}
          className="w-full h-screen border-none"
          allowFullScreen
          title="Full Page App"
        ></iframe>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-muted-foreground">No iframe available</p>
        </div>
      )}
    </div>
  );
}
