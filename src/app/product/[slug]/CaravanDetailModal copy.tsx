 "use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./popup.css";
import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import { createProductEnquiry } from "@/api/enquiry/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CaravanDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preloadedImages: string[];
  remainingImages: string[];
  product: {
    id?: string | number;
    slug?: string;
    name: string;
    image: string;
    price: number;
    regularPrice: string | number;
    salePrice: string | number;
    isPOA: boolean;
    location?: string;
  };
};

export default function CaravanDetailModal({
  isOpen,
  onClose,
  preloadedImages,
  remainingImages,
  product,
}: CaravanDetailModalProps) {
  
  const swiperRef = useRef<SwiperType | null>(null);
  
  // ✅ Combine all images immediately - no dynamic loading
  const allImages = [...preloadedImages, ...remainingImages];
  
  // ✅ Track loaded state for lazy loading
  const [loadedIndexes, setLoadedIndexes] = useState<Set<number>>(
    new Set([0, 1, 2, 3, 4,5,6,7,8,9]) // First 5 loaded
  );
const BATCH_SIZE = 10;
const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  // ✅ When slide changes, preload nearby images
 const handleSlideChange = useCallback(
  (swiper: SwiperType) => {
    const current = swiper.activeIndex;

    // when user reaches last 2 of current batch → preload next batch
    if (current >= visibleCount - 2) {
      setVisibleCount((prev) =>
        Math.min(prev + BATCH_SIZE, allImages.length)
      );
    }
  },
  [visibleCount, allImages.length]
);


  // ✅ Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLoadedIndexes(new Set([0, 1, 2, 3, 4]));
    }
  }, [isOpen]);

  // Form states (same as before)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    postcode: "",
    message: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    postcode: false,
    message: false,
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const router = useRouter();

  const NAME_RE = /^[A-Za-z][A-Za-z\s'.-]{1,49}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\d{7,15}$/;
  const POST_RE = /^\d{4}$/;

  const validate = (f = form) => {
    const e: Partial<typeof form> = {};
    if (!f.name.trim()) e.name = "Name is required";
    else if (!NAME_RE.test(f.name.trim()))
      e.name = "Use letters & spaces only (2–50 chars)";
    if (!f.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email";
    if (!f.phone.trim()) e.phone = "Phone is required";
    else if (!PHONE_RE.test(f.phone.trim())) e.phone = "Digits only (7–15)";
    if (!f.postcode.trim()) e.postcode = "Postcode is required";
    else if (!POST_RE.test(f.postcode.trim())) e.postcode = "4 digit postcode";
    return e;
  };

  const setField = (key: keyof typeof form, value: string) => {
    if (key === "phone" || key === "postcode") value = value.replace(/\D/g, "");
    setForm((p) => ({ ...p, [key]: value }));
    if (touched[key]) setErrors(validate({ ...form, [key]: value }));
  };

  const onBlur = (key: keyof typeof form) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(form));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    setTouched({
      name: true,
      email: true,
      phone: true,
      postcode: true,
      message: false,
    });
    if (Object.keys(v).length) return;

    setSubmitting(true);
    setOkMsg(null);
    try {
      const data = await createProductEnquiry({
        product_id: product.id ?? product.slug ?? product.name,
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || "",
        postcode: form.postcode.trim(),
      });

      if (data?.success && data.data?.redirect_slug) {
        router.push(`/${data.data.redirect_slug}`);
      } else {
        router.push("/thank-you-default");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send. Try again.";
      setErrors((p) => ({ ...p, email: message }));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setOkMsg(null);
      setErrors({});
      setTouched({
        name: false,
        email: false,
        phone: false,
        postcode: false,
        message: false,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDisplayPrice = () => {
    const sale = Number(String(product.salePrice).replace(/[^0-9.]/g, ""));
    const regular = Number(String(product.regularPrice).replace(/[^0-9.]/g, ""));
    if (sale > 0) return product.salePrice;
    if (regular > 0) return product.regularPrice;
    return "POA";
  };


  useEffect(() => {
  if (!isOpen) return;

  // Preload ALL images immediately
  allImages.forEach((src) => {
    const img = new window.Image();
    img.src = src;
  });
}, [isOpen, allImages]);

  return (
    <div className="custom-model-main carava_details show">
      <div className="custom-model-inner">
        <div className="close-btn" onClick={onClose}>×</div>
        <div className="custom-model-wrap">
          <div className="pop-up-content-wrap">
            <div className="container">
              <div className="row">
                {/* Left Content */}
                <div className="col-lg-9">
                  <div className="pop-top">
                    <h3>{product.name}</h3>
                    <div className="vehicleThumbDetails__part__price pop_up_price">
                      <span>
                        <span className="woocommerce-Price-amount amount">
                          <bdi>{getDisplayPrice()}</bdi>
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="single-product-slider">
                    <Swiper
                      modules={[Navigation, Pagination]}
                      navigation
                      pagination={{ clickable: true }}
                      onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                      }}
                      onSlideChange={handleSlideChange}
                    >
                      {/* ✅ All slides rendered, but images lazy loaded */}
  {allImages.map((img, idx) => (
                        <SwiperSlide
                          key={`slide-${idx}`}
                          className="flex justify-center items-center"
                        >
                          {loadedIndexes.has(idx) ? (
                            <Image
                              src={img}
                              alt={`Slide ${idx + 1}`}
                              width={0}
                              height={0}
                              sizes="100vw"
                              className="w-full h-auto"
                              unoptimized
                              priority={idx < 2}
                              onLoad={() => {
                                // Preload next images when current loads
                                setLoadedIndexes(prev => {
                                  const newSet = new Set(prev);
                                  newSet.add(idx + 1);
                                  newSet.add(idx + 2);
                                  return newSet;
                                });
                              }}
                            />
                          ) : (
                            // ✅ Placeholder while image loads

                            <div 
                              className="image-placeholder"
                              style={{
                                width: '100%',
                                height: '400px',
                                background: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <span>Loading...</span>
                            </div>
                          )}
                        </SwiperSlide>
                      ))}
                    </Swiper>

                    <div className="image-counter" style={{ 
                      textAlign: 'center', 
                      marginTop: '10px',
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      {allImages.length} images
                    </div>
                  </div>
                </div>

                {/* Right Content - Form (same as before) */}
                <div className="col-lg-3">
                  <div className="sidebar-enquiry">
                    <form className="wpcf7-form" noValidate onSubmit={onSubmit}>
                      <div className="form">
                        <h4>Contact Dealer</h4>

                        <div className="form-item">
                          <p>
                            <input
                              id="enquiry2-name"
                              name="enquiry2-name"
                              type="text"
                              className={`wpcf7-form-control${errors.name && touched.name ? " is-invalid" : ""}`}
                              value={form.name}
                              onChange={(e) => setField("name", e.target.value)}
                              onBlur={() => onBlur("name")}
                              required
                              autoComplete="off"
                            />
                            <label htmlFor="enquiry2-name">Name</label>
                          </p>
                          {touched.name && errors.name && (
                            <div className="cfs-error">{errors.name}</div>
                          )}
                        </div>

                        <div className="form-item">
                          <p>
                            <input
                              id="enquiry2-email"
                              name="enquiry2-email"
                              type="email"
                              className={`wpcf7-form-control${errors.email && touched.email ? " is-invalid" : ""}`}
                              value={form.email}
                              onChange={(e) => setField("email", e.target.value)}
                              onBlur={() => onBlur("email")}
                              required
                              autoComplete="off"
                            />
                            <label htmlFor="enquiry2-email">Email</label>
                          </p>
                          {touched.email && errors.email && (
                            <div className="cfs-error">{errors.email}</div>
                          )}
                        </div>

                        <div className="form-item">
                          <p className="phone_country">
                            <span className="phone-label">+61</span>
                            <input
                              id="enquiry2-phone"
                              name="enquiry2-phone"
                              type="tel"
                              inputMode="numeric"
                              className={`wpcf7-form-control${errors.phone && touched.phone ? " is-invalid" : ""}`}
                              value={form.phone}
                              onChange={(e) => setField("phone", e.target.value)}
                              onBlur={() => onBlur("phone")}
                              required
                              autoComplete="off"
                            />
                            <label htmlFor="enquiry2-phone">Phone</label>
                          </p>
                          {touched.phone && errors.phone && (
                            <div className="cfs-error">{errors.phone}</div>
                          )}
                        </div>

                        <div className="form-item">
                          <p>
                            <input
                              id="enquiry2-postcode"
                              name="enquiry2-postcode"
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              className={`wpcf7-form-control${errors.postcode && touched.postcode ? " is-invalid" : ""}`}
                              value={form.postcode}
                              onChange={(e) => setField("postcode", e.target.value)}
                              onBlur={() => onBlur("postcode")}
                              required
                              autoComplete="off"
                            />
                            <label htmlFor="enquiry2-postcode">Postcode</label>
                          </p>
                          {touched.postcode && errors.postcode && (
                            <div className="cfs-error">{errors.postcode}</div>
                          )}
                        </div>

                        <div className="form-item">
                          <p>
                            <label htmlFor="enquiry4-message">Message (optional)</label>
                            <textarea
                              id="enquiry4-message"
                              name="enquiry4-message"
                              value={form.message}
                              onChange={(e) => setField("message", e.target.value)}
                              className="wpcf7-form-control wpcf7-textarea"
                            ></textarea>
                          </p>
                        </div>

                        {okMsg && <div className="cfs-success">{okMsg}</div>}

                        <p className="terms_text">
                          By clicking &apos;Send Enquiry&apos;, you agree to
                          Caravan Marketplace{" "}
                          <Link href="/privacy-collection-statement" target="_blank">
                            Collection Statement
                          </Link>
                          ,{" "}
                          <Link href="/privacy-policy" target="_blank">
                            Privacy Policy
                          </Link>{" "}
                          and{" "}
                          <Link href="/terms-conditions" target="_blank">
                            Terms and Conditions
                          </Link>
                          .
                        </p>

                        <div className="submit-btn">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                          >
                            {submitting ? "Sending..." : "Send Enquiry"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-overlay" onClick={onClose}></div>
    </div>
  );
}
