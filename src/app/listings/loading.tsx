import React from "react";

export default function ListingsLoading() {
  return (
    <section className="loading-section bg-gray-100 section-padding pb-30">
      <div className="container">
        <div className="content">
          {/* Breadcrumb skeleton */}
          <div className="header mb-4">
            <div
              className="skeleton-line"
              style={{ width: "150px", height: "16px" }}
            ></div>
          </div>

          {/* Title skeleton */}
          <div
            className="skeleton-line mb-6"
            style={{ width: "300px", height: "32px" }}
          ></div>

          <div className="row">
            {/* Sidebar skeleton */}
            <div className="col-lg-3 col-sm-4 hidden-xs">
              <div className="filter-skeleton">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="filter-item-skeleton mb-4">
                    <div
                      className="skeleton-line mb-2"
                      style={{ width: "100px", height: "18px" }}
                    ></div>
                    <div
                      className="skeleton-box"
                      style={{ width: "100%", height: "40px" }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Products skeleton */}
            <div className="col-lg-9 col-md-8">
              {/* Top bar skeleton */}
              <div className="top-filter mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div
                    className="skeleton-line"
                    style={{ width: "200px", height: "16px" }}
                  ></div>
                  <div
                    className="skeleton-box"
                    style={{ width: "150px", height: "38px" }}
                  ></div>
                </div>
              </div>

              {/* Product cards skeleton */}
              <div className="dealers-section product-type">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="product-skeleton mb-4">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content p-3">
                      <div
                        className="skeleton-line mb-2"
                        style={{ width: "80%", height: "20px" }}
                      ></div>
                      <div
                        className="skeleton-line mb-2"
                        style={{ width: "60%", height: "14px" }}
                      ></div>
                      <div
                        className="skeleton-line mb-2"
                        style={{ width: "40%", height: "24px" }}
                      ></div>
                      <div className="d-flex gap-2">
                        <div
                          className="skeleton-box"
                          style={{ width: "80px", height: "14px" }}
                        ></div>
                        <div
                          className="skeleton-box"
                          style={{ width: "80px", height: "14px" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

     
    </section>
  );
}
