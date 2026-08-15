import { Navigate } from 'react-router-dom';
import { staticContent } from './static-content';

export function StaticPage({ slug }: { slug: string }) {
  const content = staticContent[slug];

  if (!content) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="border border-border bg-background">
        <div className="px-8 py-16 md:px-16 md:py-20 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {content.subtitle}
          </p>
          <h1 className="mt-6 text-3xl md:text-5xl font-bold text-foreground leading-[1.1]">
            {content.title}
          </h1>
        </div>

        <div className="px-8 md:px-16 py-12">
          {content.sections.map((section, i) => (
            <div key={i} className={i > 0 ? 'mt-12' : ''}>
              <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">
                {section.heading}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div className="px-8 md:px-16 py-5 bg-muted border-t border-border text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Market — {content.title}
          </p>
        </div>
      </div>
    </div>
  );
}
