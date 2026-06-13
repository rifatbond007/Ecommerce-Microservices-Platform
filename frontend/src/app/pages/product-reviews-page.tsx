import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Plus, ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react';
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

  const renderStars = (rating: number, interactive = false, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
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
            'transition-all duration-150',
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          )}
        >
          <Star
            className={cn(
              starSize,
              i <= maxStars
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-4 w-16 mb-6" />
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button
          onClick={() => navigate(-1)}
          className="group text-sm text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Reviews</h1>
          {reviews.length > 0 && (
            <p className="text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 && 's'}</p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Write a Review</DialogTitle>
            </DialogHeader>
            <Separator />
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rating</Label>
                <div className="flex gap-1">{renderStars(0, true, 'md')}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-title" className="text-sm font-medium">Title</Label>
                <Input
                  id="review-title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Summary of your review"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-comment" className="text-sm font-medium">Comment</Label>
                <textarea
                  id="review-comment"
                  value={form.comment}
                  onChange={e => setForm({ ...form, comment: e.target.value })}
                  placeholder="Tell others about your experience"
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="rounded-lg">
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent mr-2" />
                ) : null}
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-destructive mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 overflow-hidden"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400/10 to-amber-600/10 flex items-center justify-center mb-6">
            <MessageSquare className="h-10 w-10 text-amber-500/60" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">Be the first to share your thoughts about this product.</p>
          <Button onClick={() => setDialogOpen(true)} className="rounded-full shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
          className="space-y-4"
        >
          {reviews.map((review) => {
            const initials = review.user?.firstName
              ? `${review.user.firstName[0]}${review.user.lastName?.[0] || ''}`
              : '?';
            const userName = review.user?.firstName
              ? `${review.user.firstName} ${review.user.lastName || ''}`
              : review.user?.name || 'Anonymous';
            return (
              <motion.div
                key={review.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 14 } },
                }}
              >
                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-background">
                          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-sm font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {userName} &middot; {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={review.rating >= 4 ? 'default' : review.rating >= 3 ? 'warning' : 'secondary'} className="text-[11px] leading-none py-0.5 shrink-0">
                        {review.rating}/5
                      </Badge>
                    </div>
                    <div className="pl-[52px]">
                      <h4 className="font-medium text-sm mb-1">{review.title}</h4>
                      {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
