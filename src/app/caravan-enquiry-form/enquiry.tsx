"use client";

import React, { useState } from "react";

type FormState = {
  "your-name": string;
  "your-email": string;
  "your-phone": string;
  "you-postcode": string; // keep as-is since your CF7 works with this key
  "your-message": string;
  "caravan-type": "";
  condition: "";
  budget: "";
  requirements: "";
};

export default function ContactSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<FormState>({
    "your-name": "",
    "your-email": "",
    "your-phone": "",
    "you-postcode": "",
    "your-message": "",
    "caravan-type": "",
    condition: "",
    budget: "",
    requirements: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // clear field error on change
    if (errors[e.target.name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!formData["your-name"].trim()) next["your-name"] = "Name is required.";
    if (!formData["your-email"].trim()) {
      next["your-email"] = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData["your-email"])) {
      next["your-email"] = "Enter a valid email.";
    }
    if (!formData["your-phone"].trim()) {
      next["your-phone"] = "Phone is required.";
    } else if (!/^[0-9\s+\-()]{7,20}$/.test(formData["your-phone"])) {
      next["your-phone"] = "Enter a valid phone number.";
    }
    if (!formData["you-postcode"].trim()) {
      next["you-postcode"] = "Postcode is required.";
    }
    if (!formData["caravan-type"].trim()) {
      next["caravan-type"] = "type is required.";
    }
    if (!formData["condition"].trim()) {
      next["condition"] = "condition is required.";
    }
    if (!formData["budget"].trim()) {
      next["budget"] = "budget is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (loading) return; // guard
    if (!validate()) {
      setMessage("⚠️ All fields are required.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("_wpcf7", "3290");
      form.append("_wpcf7_version", "5.9.3");
      form.append("_wpcf7_locale", "en_US");
      form.append("_wpcf7_unit_tag", "wpcf7-f3290-p45-o1");
      form.append("_wpcf7_container_post", "45");
      form.append("your-name", formData["your-name"]);
      form.append("your-email", formData["your-email"]);
      form.append("your-phone", formData["your-phone"]);
      form.append("you-postcode", formData["you-postcode"]);
      form.append("caravan-type", formData["caravan-type"]);
      form.append("condition", formData.condition);
      form.append("budget", formData.budget);
      form.append("requirements", formData.requirements);
      form.append("your-message", formData["your-message"]);
      Object.entries(formData).forEach(([key, value]) =>
        form.append(key, value)
      );

      const res = await fetch(
        "https://www.caravansforsale.com.au/wp-json/contact-form-7/v1/contact-forms/155838/feedback",
        { method: "POST", body: form }
      );

      const data = await res.json();

      if (data.status === "mail_sent") {
        setMessage("✅ Message sent successfully!");
        // clear form + errors
        setFormData({
          "your-name": "",
          "your-email": "",
          "your-phone": "",
          "you-postcode": "",
          "your-message": "",
          "caravan-type": "",
          condition: "",
          budget: "",
          requirements: "",
        });
        setErrors({});
      } else {
        setMessage("❌ Error: " + (data.message || "Failed to send message."));
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  const hasAnyError = Object.values(errors).some(Boolean);

  return (
    <>
      <section className="community contact_top section-padding style-5">
        <div className="container">
          <div className="section-head text-center style-4">
            <h2 className="text-center mb-20">
              Exclusive Offers From Select<br></br>Quality Caravan Manufacturers
            </h2>
          </div>
        </div>
      </section>

      <section className="contact section-padding pt-0 style-6">
        <div className="container">
          <div className="content">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <form onSubmit={handleSubmit} className="form" method="post">
                  <p className="text-center text-danger fs-12px mb-30">
                    Fill out the form below, and we&apos;ll send you exclusive
                    deals for the best caravans in the market.
                  </p>
                  <div className="row">
                    {/* Name */}
                    <div className="col-lg-6">
                      <div className="form-group mb-20">
                        <input
                          type="text"
                          name="your-name"
                          className="form-control"
                          placeholder="Name*"
                          value={formData["your-name"]}
                          onChange={handleChange}
                          required
                        />
                        {errors["your-name"] && (
                          <small className="text-danger">
                            {errors["your-name"]}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-lg-6">
                      <div className="form-group mb-20">
                        <input
                          type="text"
                          name="your-email"
                          className="form-control"
                          placeholder="Email Address*"
                          value={formData["your-email"]}
                          onChange={handleChange}
                          required
                        />
                        {errors["your-email"] && (
                          <small className="text-danger">
                            {errors["your-email"]}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="col-lg-6">
                      <div className="form-group mb-20">
                        <input
                          type="text"
                          name="your-phone"
                          className="form-control"
                          placeholder="Phone Number*"
                          value={formData["your-phone"]}
                          onChange={handleChange}
                          required
                        />
                        {errors["your-phone"] && (
                          <small className="text-danger">
                            {errors["your-phone"]}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Postcode */}
                    <div className="col-lg-6">
                      <div className="form-group mb-20">
                        <input
                          type="text"
                          name="you-postcode"
                          className="form-control"
                          placeholder="Postcode*"
                          value={formData["you-postcode"]}
                          onChange={handleChange}
                          required
                        />
                        {errors["you-postcode"] && (
                          <small className="text-danger">
                            {errors["you-postcode"]}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Caravan Type */}
                    <div className="col-lg-6">
                      <div className="form-group mb-20">
                        <select
                          name="caravan-type"
                          className="form-control"
                          value={formData["caravan-type"]}
                          onChange={handleChange}
                          required
                        >
                          <option value="">
                            What type of caravan are you looking for?
                          </option>
                          <option value="Off Road">Off Road</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Pop Top">Pop Top</option>
                          <option value="Luxury">Luxury</option>
                          <option value="Family">Family</option>
                          <option value="Touring">Touring</option>
                        </select>
                        {errors["caravan-type"] && (
                          <small className="text-danger">
                            {errors["caravan-type"]}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Condition */}
                    <div className="col-lg-6">
                      <div className="form-group mb-20">
                        <select
                          name="condition"
                          className="form-control"
                          value={formData.condition}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Condition</option>
                          <option value="New">New</option>
                          <option value="Near New">Near New</option>
                          <option value="Used">Used</option>
                        </select>
                        {errors.condition && (
                          <small className="text-danger">
                            {errors.condition}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <input
                          type="text"
                          name="budget"
                          className="form-control"
                          placeholder="What is your budget?*"
                          value={formData.budget}
                          onChange={handleChange}
                          required
                        />
                        {errors.budget && (
                          <small className="text-danger">{errors.budget}</small>
                        )}
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <textarea
                          name="requirements"
                          className="form-control"
                          placeholder="Requirements (Description)*"
                          value={formData.requirements}
                          onChange={handleChange}
                          required
                        />
                        {errors.requirements && (
                          <small className="text-danger">
                            {errors.requirements}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col-lg-12 text-center">
                      <input
                        type="submit"
                        value={loading ? "Submitting..." : "SUBMIT"}
                        className="btn bg-blue4 fw-bold text-white text-light fs-12px"
                        disabled={loading}
                      />
                    </div>

                    {/* Message */}
                    {message && (
                      <div className="col-lg-12 mt-3 text-center">
                        <p
                          className={
                            hasAnyError ? "text-danger" : "text-success"
                          }
                        >
                          {message}
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
