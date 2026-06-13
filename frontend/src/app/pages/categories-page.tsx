import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, Tag } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  children?: Category[];
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/categories/tree');
      setCategories(r.data.categories || []);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>

      {error && (
        <div className="flex items-center gap-2 text-destructive mb-4 p-3 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No categories available</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Card key={cat.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                        <Tag className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <Link to={`/products?categoryId=${cat.id}`} className="font-semibold hover:text-primary">
                        {cat.name}
                      </Link>
                      {cat.children && cat.children.length > 0 && (
                        <p className="text-xs text-muted-foreground">{cat.children.length} subcategories</p>
                      )}
                    </div>
                  </div>
                </div>
                {cat.children && cat.children.length > 0 && (
                  <div className="p-2">
                    {cat.children.slice(0, 4).map(child => (
                      <Link
                        key={child.id}
                        to={`/products?categoryId=${child.id}`}
                        className="block px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                    {cat.children.length > 4 && (
                      <Link
                        to={`/products?categoryId=${cat.id}`}
                        className="block px-3 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors"
                      >
                        View all {cat.children.length} subcategories
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
