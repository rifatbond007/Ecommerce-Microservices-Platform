import { Navigate } from 'react-router-dom';
import { staticContent } from './static-content';

export function StaticPage({ slug }: { slug: string }) {
  const content = staticContent[slug];

  if (!content) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="border border-[#e5e5e5] bg-white">
        <div className="px-8 py-16 md:px-16 md:py-20 border-b border-[#e5e5e5]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
            {content.subtitle}
          </p>
          <h1 className="mt-6 text-3xl md:text-5xl font-bold text-[#111111] leading-[1.1]">
            {content.title}
          </h1>
        </div>

        <div className="px-8 md:px-16 py-12">
          {content.sections.map((section, i) => (
            <div key={i} className={i > 0 ? 'mt-12' : ''}>
              <h2 className="text-lg font-bold text-[#111111] uppercase tracking-wider">
                {section.heading}
              </h2>
              <p className="mt-3 text-sm text-[#666666] leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div className="px-8 md:px-16 py-5 bg-[#fafafa] border-t border-[#e5e5e5] text-center">
          <p className="text-xs text-[#777777] uppercase tracking-wider">
            Market — {content.title}
          </p>
        </div>
      </div>
    </div>
  );
}
