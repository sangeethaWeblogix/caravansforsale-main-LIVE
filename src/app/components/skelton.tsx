import Skeleton from '@mui/material/Skeleton';

export default function SkeletonListing() {
  return (
    <div className="col-lg-6 col-md-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card mb-4">
          <Skeleton variant="rectangular" width="100%" height={200} />
          <Skeleton variant="text" width="80%" height={30} />
          <Skeleton variant="text" width="40%" height={20} />
        </div>
      ))}
    </div>
  );
}
