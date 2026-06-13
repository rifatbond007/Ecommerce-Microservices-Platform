import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { searchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SearchX, Package } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 16 } },
};

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    setLoading(true);
    try {
      const { data } = await searchApi.search(query);
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Search</h1>
        <p className="text-muted-foreground mb-6">Find what you're looking for</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex gap-3 mb-8 max-w-xl"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-12 rounded-xl shadow-sm"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="h-12 px-6 rounded-xl shadow-sm"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
          ) : (
            'Search'
          )}
        </Button>
      </motion.div>

      {searched && (
        <motion.div
          key="results"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden rounded-xl shadow-sm">
                  <Skeleton className="aspect-square rounded-none" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <SearchX className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find anything for "<span className="font-medium text-foreground">{query}</span>". Try adjusting your search terms.
              </p>
            </motion.div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Found {results.length} result{results.length !== 1 && 's'} for "<span className="font-medium text-foreground">{query}</span>"
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.map((p: any) => (
                  <motion.div key={p.id} variants={item}>
                    <Card className="group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                      <Link to={`/products/${p.id}`}>
                        <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <Package className="h-12 w-12 text-muted-foreground/40" />
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <Link to={`/products/${p.id}`}>
                          <h3 className="font-medium truncate group-hover:text-primary transition-colors">{p.name}</h3>
                        </Link>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-lg font-bold">${p.price}</p>
                          {p.compareAtPrice && (
                            <Badge variant="warning" className="text-[10px] leading-none py-0.5">
                              Sale
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {!searched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6">
            <Search className="h-12 w-12 text-primary/60" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Search our catalog</h3>
          <p className="text-muted-foreground max-w-md">
            Type a keyword above and explore products across our marketplace.
          </p>
        </motion.div>
      )}
    </div>
  );
}
