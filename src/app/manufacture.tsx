"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchRangeFeaturedCategories } from "@/api/homeMake/api";

type MakeItem = {
  term_id: number;
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string | null;
  custom_link?: string | null;
  caravan_type?: string | string[] | null; // be flexible
  is_top?: boolean | null;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/\s+|_+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
const isError = (e: unknown): e is Error =>
  typeof e === "object" && e !== null && "message" in e;
const Manufacture = () => {
  const [items, setItems] = useState<MakeItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchRangeFeaturedCategories();
        if (mounted) setItems((res || []) as MakeItem[]);
      } catch (e: unknown) {
        if (mounted) {
          const msg = isError(e) ? e.message : "Failed to load manufacturers";
          setErr(msg);
          console.error("Manufacture fetch error:", e);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const normalizeCaravanType = (v: MakeItem["caravan_type"]) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    // if backend sends comma-separated string
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const buildHref = (man: MakeItem) => {
    // Use custom_link if present and already a valid relative or absolute URL
    if (man.custom_link) {
      // Clean trailing or leading slashes for relative paths
      if (man.custom_link.startsWith("/")) {
        return man.custom_link;
      } else {
        // For URLs without a leading slash, add one to keep consistent path style
        return `/${man.custom_link}`;
      }
    }

    // Use slug if provided, else slugify the name
    const slugValue = man.slug?.trim() || slugify(man.name);

    // Encode slug and prepend with /listings
    return `/listings/${encodeURIComponent(slugValue)}`;
  };

  console.log("make", items);

  return (
    <div>
      <div className="container">
        <div className="row">
          <div className="col">
            <div className="section-head mb-40">
              <h2>
                High-Quality Caravans for Sale – Without the Big Brand Price Tag
              </h2>
              <p>
                Discover some of the best caravan manufacturers you may not have
                heard of — offering superior craftsmanship, smart floor plans,
                and unbeatable pricing for the quality.
              </p>
            </div>
          </div>
        </div>

        <div className="range-home position-relative">
          {err && <p className="text-danger">{err}</p>}

          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              nextEl: ".swiper-button-next-manufacturer",
              prevEl: ".swiper-button-prev-manufacturer",
            }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1, spaceBetween: 20 },
              768: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 25 },
            }}
            className="swiper-container"
          >
            {items?.map((man) => {
              const types = normalizeCaravanType(man.caravan_type);
              const href = buildHref(man);
              const logo = man.logo_url || "/placeholder-logo.svg"; // ensure you have this asset or swap
              const desc =
                (man.description || "").length > 140
                  ? `${man.description!.slice(0, 140)}…`
                  : man.description || "";

              return (
                <SwiperSlide key={`${man.term_id}-${man.name}`}>
                  <div className="post_item">
                    <div className="post_image">
                      {/* If external domains are used, ensure they're whitelisted in next.config.js */}
                      <Image
                        src={logo}
                        alt={man.name}
                        width={300}
                        height={200}
                        style={{ objectFit: "contain" }}
                      />
                    </div>

                    <div className="post_info">
                      <h3>{man.name}</h3>
                      {desc && <p className="mb-3">{desc}</p>}

                      {!!types.length && (
                        <ul className="mb-3">
                          <li>
                            <i className="bi bi-info-circle" />
                            <span>{types.join(", ")}</span>
                          </li>
                        </ul>
                      )}

                      {/* UI shows the name, but href goes to listings/<value> */}
                      <Link href={href}>
                        View Listings <i className="bi bi-chevron-right" />
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          <div className="swiper-button-next swiper-button-next-manufacturer" />
          <div className="swiper-button-prev swiper-button-prev-manufacturer" />
        </div>
      </div>
    </div>
  );
};

export default Manufacture;
