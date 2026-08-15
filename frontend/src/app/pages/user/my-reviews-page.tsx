import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { userApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api';

interface Review {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  rating: number;
  title?: string;
  comment?: string;
  helpful?: number;
  createdAt?: string;
}

export function MyReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // userApi.getReviews requires productId; we don't have one. Call api directly via endpoint
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || '/api/v1'}/users/me/reviews`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const json = await res.json();
        if (cancelled) return;
        const data = (json.data ?? json) as { reviews?: Review[] };
        setReviews(data.reviews ?? []);
      } catch (err) {
        toast({
          title: 'Failed to load reviews',
          description: getErrorMessage(err),
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleHelpful = async (id: string) => {
    setBusy(id);
    try {
      await userApi.markReviewHelpful(id);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, helpful: (r.helpful ?? 0) + 1 } : r))
      );
      toast({ title: 'Marked as helpful', variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Account
        </p>
        <h1 className="mt-1 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          My reviews
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reviews you&apos;ve written on products.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-sm text-muted-foreground">Loading…</div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
              <Button asChild className="mt-4">
                <Link to="/orders">Review a recent order</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reviews.map((review) => (
                <div key={review.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${review.productId}`}
                        className="text-sm font-bold text-foreground hover:underline"
                      >
                        {review.productName ?? `Product ${review.productId.slice(0, 8)}`}
                      </Link>
                      <div className="mt-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${
                              n <= review.rating
                                ? 'fill-foreground text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                      {review.title && (
                        <p className="mt-3 text-sm font-bold text-foreground">
                          {review.title}
                        </p>
                      )}
                      {review.comment && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                      <Separator className="my-3" />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHelpful(review.id)}
                          disabled={busy === review.id}
                        >
                          <ThumbsUp className="mr-2 h-3.5 w-3.5" />
                          Helpful{review.helpful ? ` (${review.helpful})` : ''}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}