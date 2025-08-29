import { Skeleton } from "@mui/material";
export default function BlogCardSkeleton() {
  return (
    <div className="col-lg-4">
      <div className="side-posts">
        <div className="item">
          {/* Image placeholder */}
          <div className="img img-cover">
            <Skeleton variant="rectangular" width="100%" height={200} />
          </div>

          {/* Text placeholders */}
          <div className="info mt-2">
            <Skeleton variant="text" width="80%" height={28} />
            <Skeleton variant="text" width="40%" height={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
