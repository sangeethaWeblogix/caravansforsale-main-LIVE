import Skeleton from "@mui/material/Skeleton";

export default function SkeletonListing({ count = 8 }) {
  return (
    <div className="row">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-lg-4 col-md-6 mb-4">
          <div className="skeleton-card p-2 rounded shadow-sm">
            <Skeleton
              variant="rectangular"
              width="100%"
              height={200}
              animation="wave"
            />
            <div className="mt-3">
              <Skeleton variant="text" width="80%" height={25} />
              <Skeleton variant="text" width="60%" height={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
