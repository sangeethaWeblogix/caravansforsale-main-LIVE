import { Skeleton } from "@mui/material";
export default function BlogCardSkeleton() {
  return (
    <div className="card border-0 bg-transparent rounded-0 border-bottom brd-gray pb-30 mb-30">
      <div className="row">
        {/* Image skeleton */}
        <div className="col-lg-5">
          <Skeleton variant="rectangular" width="100%" height={200} />
        </div>

        {/* Content skeleton */}
        <div className="col-lg-7">
          <div className="card-body p-0">
            <Skeleton variant="text" width={120} height={20} />
            <Skeleton variant="text" width="80%" height={28} />
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton
              variant="rounded"
              width={100}
              height={36}
              sx={{ borderRadius: "18px", mt: 1 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
