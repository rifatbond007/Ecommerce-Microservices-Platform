import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass className="h-12 w-12" />}
      title="Page not found"
      description="The page you were looking for doesn't exist or was moved."
      action={
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      }
    />
  );
}