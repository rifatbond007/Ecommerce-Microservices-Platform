import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Image with graceful fallback to an icon placeholder when the URL is missing
 * or fails to load. Avoids the broken-image icon and prevents layout shift by
 * inheriting the parent's aspect ratio.
 */
export function ImageWithFallback({ src, alt, className, fallbackClassName }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);
  const placeholder = (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'flex items-center justify-center bg-muted text-muted-foreground',
        fallbackClassName,
        className
      )}
    >
      <ImageIcon className="h-8 w-8" aria-hidden />
    </div>
  );

  if (!src || errored) return placeholder;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={cn('object-cover', className)}
    />
  );
}