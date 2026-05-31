import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    try {
      const { data } = await searchApi.search(query);
      setResults(data.products || []);
    } catch { setResults([]); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <div className="flex gap-2 mb-8 max-w-md">
        <Input placeholder="Search products..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      {searched && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((p: any) => (
            <Card key={p.id} className="overflow-hidden">
              <Link to={`/products/${p.id}`}>
                <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : 'No Image'}</div>
              </Link>
              <CardContent className="p-4">
                <Link to={`/products/${p.id}`}><h3 className="font-medium truncate">{p.name}</h3></Link>
                <p className="text-lg font-semibold mt-2">${p.price}</p>
              </CardContent>
            </Card>
          ))}
          {results.length === 0 && <p className="col-span-full text-center text-muted-foreground">No results found</p>}
        </div>
      )}
    </div>
  );
}
