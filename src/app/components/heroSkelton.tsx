"use client";
import Skeleton from "@mui/material/Skeleton";

export default function HeroSkeleton() {
  return (
    <div className="row">
      <div className="col-md-6 left_design order-lg-2">
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>
      <div className="col-md-6 right_design order-lg-1">
        <div className="deal_info">
          <div className="dd-title">
            <Skeleton variant="text" width="90%" height={36} />
            <div className="caravan_type">
              <Skeleton variant="text" width="50%" height={24} />
            </div>
            <div className="metc2">
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="30%" height={24} />
            </div>
          </div>
          <ul className="d_feature list-unstyled">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <Skeleton variant="text" width={120} height={20} />
              </li>
            ))}
          </ul>
          <Skeleton variant="rectangular" width={180} height={40} />
        </div>
      </div>
    </div>
  );
}
