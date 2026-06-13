import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, AlertCircle, Star, Plus, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  user: { firstName?: string; lastName?: string; name?: string };
  createdAt: string;
}

export function ProductReviewsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      const r = await userApi.getReviews(productId);
      setReviews(r.data.reviews || []);
    } catch {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) {
      setError('Please provide a title');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (!productId) return;
      await userApi.createReview({
        productId,
        rating: form.rating,
        title: form.title,
        comment: form.comment,
      });
      setDialogOpen(false);
      setForm({ rating: 5, title: '', comment: '' });
      await load();
    } catch {
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }, [form, productId, load]);

  const renderStars = (rating: number, interactive = false) => {
    const stars = [];
    const maxStars = interactive ? hoverRating || form.rating : rating;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setForm({ ...form, rating: i })}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={cn(
            'transition-colors',
            interactive ? 'cursor-pointer' : 'cursor-default'
          )}
        >
          <Star
            className={cn(
              'h-4 w-4',
              i <= maxStars
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-primary hover:underline mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Product Reviews</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {renderStars(0, true)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Summary of your review"
                />
              </div>
              <div className="space-y-2">
                <Label>Comment</Label>
                <Input
                  value={form.comment}
                  onChange={e => setForm({ ...form, comment: e.target.value })}
                  placeholder="Tell others about your experience"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive mb-4 p-3 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const userName = review.user?.firstName
              ? `${review.user.firstName} ${review.user.lastName || ''}`
              : review.user?.name || 'Anonymous';
            return (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {renderStars(review.rating)}
                        <span className="font-medium text-sm">{review.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {userName} &middot; {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
