"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./popup.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createProductEnquiry } from "@/api/enquiry/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CaravanDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  subImages: string[];
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
  images,
  product,
  subImages,
 }: CaravanDetailModalProps) {
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
const INITIAL_COUNT = 10;

const [slides, setSlides] = useState<string[]>([]);
const [index, setIndex] = useState(INITIAL_COUNT);
 
  // validation regex
  const NAME_RE = /^[A-Za-z][A-Za-z\s'.-]{1,49}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\d{7,15}$/;
  const POST_RE = /^\d{4}$/;


 useEffect(() => {
  if (isOpen) {
    const firstBatch = subImages.slice(0, INITIAL_COUNT);
    setSlides(firstBatch);
    setIndex(firstBatch.length); // REAL number loaded
  }
}, [isOpen, subImages]);


 const handleSlideChange = (swiper) => {
  const active = swiper.activeIndex;

  // Stop when fully loaded
  const total = subImages.length + images.length;
  if (slides.length >= total) return;

  // If user reached last loaded slide → load next
  if (active === slides.length - 1) {
    let nextBatch: string[] = [];

    // Load remaining subImages first
    
      const imageIndex = index - subImages.length;
      nextBatch = images.slice(imageIndex, imageIndex + INITIAL_COUNT);
  

    // Add only unique (no duplicates)
    if (nextBatch.length > 0) {
      setSlides((prev) => [...prev, ...nextBatch]);
      setIndex(index + nextBatch.length);
    }
  }
};




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

      // ✅ redirect logic
      if (data?.success && data.data?.redirect_slug) {
        router.push(`/${data.data.redirect_slug}`);
      } else {
        router.push("/thank-you-default");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send. Try again.";
      setErrors((p) => ({ ...p, email: message }));
      setOkMsg(null);
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

  return (
    <div className="custom-model-main carava_details show">
      <div className="custom-model-inner">
        <div className="close-btn" onClick={onClose}>
          ×
        </div>
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
                          <bdi>
                           {product.regularPrice}
                          </bdi>
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="single-product-slider">
                    <Swiper
                      modules={[Navigation, Pagination]}
                      navigation
                      pagination={{ clickable: true }}
                          onSlideChange={handleSlideChange}

                    >
                      {slides.map((img, idx) => (
                        <SwiperSlide
                          key={idx}
                          className="flex justify-center items-center"
                        >
                          <Image
                            src={img}
                            alt={`Slide ${idx + 1}`}
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto"
                            unoptimized
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                </div>

                {/* Right Content - Enquiry Form */}
                <div className="col-lg-3">
                  <div className="sidebar-enquiry">
                    <form className="wpcf7-form" noValidate onSubmit={onSubmit}>
                      <div className="form">
                        <h4>Contact Dealer</h4>

                        {/* Name */}
                        <div className="form-item">
                          <p>
                            <input
                              id="enquiry2-name"
                              name="enquiry2-name"
                              type="text"
                              className={`wpcf7-form-control${
                                errors.name && touched.name ? " is-invalid" : ""
                              }`}
                              value={form.name}
                              onChange={(e) => setField("name", e.target.value)}
                              onBlur={() => onBlur("name")}
                              required
                              autoComplete="off"
                              aria-invalid={!!(errors.name && touched.name)}
                              aria-describedby="err-name"
                            />
                            <label htmlFor="enquiry2-name">Name</label>
                          </p>
                          {touched.name && errors.name && (
                            <div id="err-name" className="cfs-error">
                              {errors.name}
                            </div>
                          )}
                        </div>

                        {/* Email */}
                        <div className="form-item">
                          <p>
                            <input
                              id="enquiry2-email"
                              name="enquiry2-email"
                              type="email"
                              className={`wpcf7-form-control${
                                errors.email && touched.email
                                  ? " is-invalid"
                                  : ""
                              }`}
                              value={form.email}
                              onChange={(e) =>
                                setField("email", e.target.value)
                              }
                              onBlur={() => onBlur("email")}
                              required
                              autoComplete="off"
                              aria-invalid={!!(errors.email && touched.email)}
                              aria-describedby="err-email"
                            />
                            <label htmlFor="enquiry2-email">Email</label>
                          </p>
                          {touched.email && errors.email && (
                            <div id="err-email" className="cfs-error">
                              {errors.email}
                            </div>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="form-item">
                          <p className="phone_country">
                            <span className="phone-label">+61</span>
                            <input
                              id="enquiry2-phone"
                              name="enquiry2-phone"
                              type="tel"
                              inputMode="numeric"
                              className={`wpcf7-form-control${
                                errors.phone && touched.phone
                                  ? " is-invalid"
                                  : ""
                              }`}
                              value={form.phone}
                              onChange={(e) =>
                                setField("phone", e.target.value)
                              }
                              onBlur={() => onBlur("phone")}
                              required
                              autoComplete="off"
                              aria-invalid={!!(errors.phone && touched.phone)}
                              aria-describedby="err-phone"
                            />
                            <label htmlFor="enquiry2-phone">Phone</label>
                          </p>
                          {touched.phone && errors.phone && (
                            <div id="err-phone" className="cfs-error">
                              {errors.phone}
                            </div>
                          )}
                        </div>

                        {/* Postcode */}
                        <div className="form-item">
                          <p>
                            <input
                              id="enquiry2-postcode"
                              name="enquiry2-postcode"
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              className={`wpcf7-form-control${
                                errors.postcode && touched.postcode
                                  ? " is-invalid"
                                  : ""
                              }`}
                              value={form.postcode}
                              onChange={(e) =>
                                setField("postcode", e.target.value)
                              }
                              onBlur={() => onBlur("postcode")}
                              required
                              autoComplete="off"
                              aria-invalid={
                                !!(errors.postcode && touched.postcode)
                              }
                              aria-describedby="err-postcode"
                            />
                            <label htmlFor="enquiry2-postcode">Postcode</label>
                          </p>
                          {touched.postcode && errors.postcode && (
                            <div id="err-postcode" className="cfs-error">
                              {errors.postcode}
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        <div className="form-item">
                          <p>
                            <label htmlFor="enquiry4-message">
                              Message (optional)
                            </label>
                            <textarea
                              id="enquiry4-message"
                              name="enquiry4-message"
                              value={form.message}
                              onBlur={() => onBlur("message")}
                              onChange={(e) =>
                                setField("message", e.target.value)
                              }
                              className="wpcf7-form-control wpcf7-textarea"
                            ></textarea>
                          </p>
                        </div>

                        {okMsg && <div className="cfs-success">{okMsg}</div>}

                        <p className="terms_text">
                          By clicking &apos;Send Enquiry&apos;, you agree to
                          Caravan Marketplace{" "}
                          <Link
                            href="/privacy-collection-statement"
                            target="_blank"
                          >
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
                {/* /Right Content */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-overlay" onClick={onClose}></div>
    </div>
  );
}
