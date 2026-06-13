import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Tags, Hash, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  children?: Category[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 14 } },
};

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-72 mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Categories</h1>
        <p className="text-muted-foreground mb-8">Browse products by category</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}

      {categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Tags className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No categories available</h3>
          <p className="text-muted-foreground max-w-md">Categories will appear here once they're set up.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {categories.map(cat => (
            <motion.div key={cat.id} variants={item}>
              <Card className="group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-0">
                  <div className="p-5 border-b bg-gradient-to-r from-muted/50 to-muted/30">
                    <div className="flex items-center gap-4">
                      {cat.image ? (
                        <div className="overflow-hidden rounded-xl">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-14 h-14 rounded-xl object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center">
                          <Hash className="h-7 w-7 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products?categoryId=${cat.id}`}
                          className="font-semibold text-base hover:text-primary transition-colors block truncate"
                        >
                          {cat.name}
                        </Link>
                        {cat.children && cat.children.length > 0 && (
                          <Badge variant="secondary" className="mt-1 text-[11px] leading-none py-0.5">
                            {cat.children.length} subcategories
                          </Badge>
                        )}
                        {(!cat.children || cat.children.length === 0) && (
                          <p className="text-xs text-muted-foreground mt-1">No subcategories</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {cat.children && cat.children.length > 0 && (
                    <div className="p-2">
                      {cat.children.slice(0, 5).map(child => (
                        <Link
                          key={child.id}
                          to={`/products?categoryId=${child.id}`}
                          className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors group/link"
                        >
                          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover/link:text-primary transition-colors shrink-0" />
                          <span className="truncate group-hover/link:text-primary transition-colors">{child.name}</span>
                        </Link>
                      ))}
                      {cat.children.length > 5 && (
                        <Link
                          to={`/products?categoryId=${cat.id}`}
                          className="block px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          View all {cat.children.length} subcategories
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
