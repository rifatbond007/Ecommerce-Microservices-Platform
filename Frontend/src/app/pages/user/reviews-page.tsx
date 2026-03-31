import { Star } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { reviews } from '../../lib/mock-data';
import { useAuthStore } from '../../store/auth-store';

export function ReviewsPage() {
  const { user } = useAuthStore();
  const userReviews = reviews.filter(r => r.userId === user?.id);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">My Reviews</h1>

      {userReviews.length > 0 ? (
        <div className="space-y-4">
          {userReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="mb-2 text-muted-foreground">{review.comment}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Star className="mb-4 inline-block h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-bold">No reviews yet</h2>
            <p className="text-muted-foreground">Share your experience with products you've purchased</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
