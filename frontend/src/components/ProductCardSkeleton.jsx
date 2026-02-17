import React from 'react';

const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
);

const ProductCardSkeleton = ({ variant = 'default' }) => {
  if (variant === 'flash') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="relative overflow-hidden bg-gray-200 h-48">
          <Shimmer />
        </div>
        <div className="p-4 space-y-3">
          <div className="relative overflow-hidden h-4 bg-gray-200 rounded w-full"><Shimmer /></div>
          <div className="relative overflow-hidden h-4 bg-gray-200 rounded w-3/4"><Shimmer /></div>
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="relative overflow-hidden h-4 w-4 bg-gray-200 rounded-full"><Shimmer /></div>
            ))}
          </div>
          <div className="relative overflow-hidden h-6 bg-gray-200 rounded w-2/3"><Shimmer /></div>
          <div className="relative overflow-hidden h-4 bg-gray-100 rounded w-1/2"><Shimmer /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
      <div className="relative overflow-hidden bg-gray-200 h-40">
        <Shimmer />
      </div>
      <div className="p-3 space-y-2.5">
        <div className="relative overflow-hidden h-3.5 bg-gray-200 rounded w-full"><Shimmer /></div>
        <div className="relative overflow-hidden h-3.5 bg-gray-200 rounded w-4/5"><Shimmer /></div>
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="relative overflow-hidden h-3 w-3 bg-gray-200 rounded-full"><Shimmer /></div>
          ))}
        </div>
        <div className="relative overflow-hidden h-5 bg-gray-200 rounded w-1/2"><Shimmer /></div>
        <div className="relative overflow-hidden h-3 bg-gray-100 rounded w-2/3"><Shimmer /></div>
      </div>
    </div>
  );
};

const ProductGridSkeleton = ({ count = 6, columns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6', variant = 'default' }) => {
  const cards = [...Array(count)].map((_, i) => (
    <ProductCardSkeleton key={i} variant={variant} />
  ));

  if (!columns) return <>{cards}</>;

  return <div className={`grid ${columns} gap-4`}>{cards}</div>;
};

const SectionSkeleton = ({ title = true }) => (
  <div className="space-y-6">
    {title && (
      <div className="flex items-center justify-between">
        <div className="relative overflow-hidden h-8 bg-gray-200 rounded w-48"><Shimmer /></div>
        <div className="relative overflow-hidden h-5 bg-gray-200 rounded w-20"><Shimmer /></div>
      </div>
    )}
    <ProductGridSkeleton />
  </div>
);

export { ProductCardSkeleton, ProductGridSkeleton, SectionSkeleton, Shimmer };
export default ProductCardSkeleton;
