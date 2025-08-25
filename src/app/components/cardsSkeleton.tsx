// components/CardSkeleton.tsx
"use client";
import Skeleton from "@mui/material/Skeleton";

export default function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="row">
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-12 col-md-6 col-lg-4 mb-4" key={i}>
          <div className="product-card">
            <Skeleton variant="rectangular" width="100%" height={200} />
            <div className="product_de p-2">
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="50%" height={28} />
              <Skeleton variant="rectangular" width={140} height={36} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
