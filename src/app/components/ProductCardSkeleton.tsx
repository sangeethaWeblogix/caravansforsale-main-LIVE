"use client";

export default function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton">
      <div className="img">
        <div
          style={{
            width: "100%",
            height: "250px",
            borderRadius: "6px",
            background: "#e0e0e0",
          }}
        />
      </div>
      <div className="product_de">
        <div className="info">
          <h6 className="category">
            <div
              style={{
                width: "80px",
                height: "14px",
                borderRadius: "4px",
                background: "#ddd",
              }}
            />
          </h6>
          <h3 className="title">
            <div
              style={{
                width: "200px",
                height: "18px",
                borderRadius: "4px",
                background: "#ddd",
              }}
            />
          </h3>
        </div>
        <div className="price">
          <div
            style={{
              width: "100px",
              height: "16px",
              borderRadius: "4px",
              background: "#ddd",
            }}
          />
        </div>
      </div>
    </div>
  );
}
