 // app/listings/loading.tsx
export default function ListingsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar skeleton */}
        <div className="lg:w-1/4">
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-40 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-40 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Listings grid skeleton */}
        <div className="lg:w-3/4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                <div className="h-6 bg-gray-100 rounded w-1/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}