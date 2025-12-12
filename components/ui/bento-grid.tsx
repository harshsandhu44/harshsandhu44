import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getColSpanClass } from "@/lib/utils";

export interface BentoItem {
  id: string | number;
  title: string;
  description?: string;
  image?: string;
  href?: string;
  tags?: string[];
  colSpan?: 1 | 2 | 3;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

export default function BentoGrid({ items, className = "" }: BentoGridProps) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`
        grid w-full grid-cols-1 gap-4 
        md:grid-cols-2 md:auto-rows-[25rem] 
        lg:grid-cols-3 lg:auto-rows-[25rem] 
        ${className}
      `}
    >
      {items.map((item, index) => (
        <BentoCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

function BentoCard({ item, index }: { item: BentoItem; index: number }) {
  const isLarge = index % 3 === 0;
  const colSpanClass = item.colSpan
    ? getColSpanClass(item.colSpan)
    : isLarge
      ? "md:col-span-2 lg:col-span-2"
      : "md:col-span-1 lg:col-span-1";

  const ContentWrapper = item.href ? Link : "div";
  const wrapperProps = item.href ? { href: item.href } : {};

  return (
    <div
      className={`
        group relative overflow-hidden rounded-lg bg-card border 
        min-h-[25rem] flex flex-col justify-end
        ${colSpanClass}
      `}
    >
      {/* @ts-expect-error Make the item unclickable on missing href */}
      <ContentWrapper className="block h-full w-full" {...wrapperProps}>
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 h-full w-full">
          {item.image ? (
            <>
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-60"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-card" />
            </>
          ) : (
            <div className="h-full w-full bg-card" />
          )}
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full p-6 md:p-8 transition-transform duration-300">
          {/* Arrow Icon */}
          {item.href && (
            <div className="absolute top-6 right-6 opacity-0 transition-all duration-300 group-hover:opacity-100">
              <div className="rounded-full bg-card p-2 text-card-foreground shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                <ArrowUpRight size={20} />
              </div>
            </div>
          )}

          <div className="translate-y-4 transition-transform duration-300 group-hover:translate-y-0 space-y-3">
            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-card-foreground backdrop-blur-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Text Content */}
            <div>
              <h3 className="font-serif text-2xl font-bold text-card-foreground md:text-3xl">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-2 text-sm text-card-foreground md:text-base opacity-0 transition-opacity duration-300 group-hover:opacity-100 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
}
