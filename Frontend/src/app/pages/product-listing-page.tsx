import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Filter, Grid, List } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/product-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { products, categories, brands } from '../lib/mock-data';

export function ProductListingPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const categorySlug = slug;
  
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category
    if (categorySlug) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        filtered = filtered.filter(p => p.categoryId === category.id);
      }
    }

    // Filter by price range
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filter by brands
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brandId));
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(p => p.rating >= minRating);
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Featured first
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return filtered;
  }, [categorySlug, priceRange, selectedBrands, minRating, sortBy]);

  const category = categories.find(c => c.slug === categorySlug);
  const pageTitle = category ? category.name : 'All Products';

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
        <p className="text-muted-foreground">
          {filteredProducts.length} products found
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_1fr]">
        {/* Filters Sidebar */}
        <aside className={`space-y-6 ${!showFilters && 'hidden lg:block'}`}>
          <div>
            <h3 className="mb-4 font-semibold">Price Range</h3>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={500}
              step={10}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 font-semibold">Brands</h3>
            <div className="space-y-3">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={selectedBrands.includes(brand.id)}
                    onCheckedChange={() => toggleBrand(brand.id)}
                  />
                  <Label htmlFor={`brand-${brand.id}`} className="cursor-pointer">
                    {brand.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 font-semibold">Minimum Rating</h3>
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={minRating === rating}
                    onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
                  />
                  <Label htmlFor={`rating-${rating}`} className="cursor-pointer">
                    {rating}+ Stars
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setPriceRange([0, 500]);
              setSelectedBrands([]);
              setMinRating(0);
            }}
          >
            Clear Filters
          </Button>
        </aside>

        {/* Products Grid */}
        <div>
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
              <p className="text-lg text-muted-foreground">No products found</p>
              <Button
                variant="link"
                onClick={() => {
                  setPriceRange([0, 500]);
                  setSelectedBrands([]);
                  setMinRating(0);
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
