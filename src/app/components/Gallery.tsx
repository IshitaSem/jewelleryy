import { ImageWithFallback } from './figma/ImageWithFallback';

interface GalleryProps {
  images: string[];
}

export function Gallery({ images }: GalleryProps) {
  const doubled = [...images, ...images];

  return (
    <section
      className="py-8 overflow-hidden"
      style={{ background: '#fff8fa' }}
    >
      <style>{`
        @keyframes gallery-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .gallery-track {
          animation: gallery-scroll 28s linear infinite;
          will-change: transform;
        }
        .gallery-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <p
        className="text-center mb-5 font-semibold text-xs uppercase tracking-[0.2em]"
        style={{ color: '#ff69b4' }}
      >
        ✨ &nbsp; our collection &nbsp; ✨
      </p>

      <div className="relative">
        {/* Marquee strip */}
        <div className="flex gallery-track gap-4 w-max">
          {doubled.map((src, i) => (
            <div
              key={i}
              className="relative flex-shrink-0 overflow-hidden rounded-2xl"
              style={{
                width: 168,
                height: 168,
                background: '#ffe4e1',
                border: '2.5px solid rgba(255, 105, 180, 0.25)',
                boxShadow: '0 3px 12px rgba(233, 30, 140, 0.08)',
              }}
            >
              <ImageWithFallback
                src={src}
                alt={`Gallery piece ${(i % images.length) + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-108"
              />
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to right, #fff8fa, transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to left, #fff8fa, transparent)' }}
        />
      </div>
    </section>
  );
}
