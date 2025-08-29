"use client";

import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    "your-name": "",

    "your-email": "",

    "your-phone": "",

    "you-postcode": "",

    "your-message": "",
  });

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    setMessage("");

    try {
      const form = new FormData();

      form.append("_wpcf7", "3290");

      form.append("_wpcf7_version", "5.9.3");

      form.append("_wpcf7_locale", "en_US");

      form.append("_wpcf7_unit_tag", "wpcf7-f3290-p45-o1");

      form.append("_wpcf7_container_post", "45");

      // append actual form values

      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });

      const res = await fetch(
        "https://www.dev.caravansforsale.com.au/wp-json/contact-form-7/v1/contact-forms/155838/feedback",
        {
          method: "POST",

          body: form,
        }
      );

      const data = await res.json();

      if (data.status === "mail_sent") {
        setMessage("✅ Message sent successfully!");

        setFormData({
          "your-name": "",

          "your-email": "",

          "your-phone": "",

          "you-postcode": "",

          "your-message": "",
        });
      } else {
        setMessage("❌ Error: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);

      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 max-w-md mx-auto p-4 border rounded-lg shadow"
    >
      <input
        type="text"
        name="your-name"
        placeholder="Your Name"
        value={formData["your-name"]}
        onChange={handleChange}
        required
        className="p-2 border rounded"
      />
      <input
        type="email"
        name="your-email"
        placeholder="Your Email"
        value={formData["your-email"]}
        onChange={handleChange}
        required
        className="p-2 border rounded"
      />
      <input
        type="text"
        name="your-phone"
        placeholder="Your Phone"
        value={formData["your-phone"]}
        onChange={handleChange}
        required
        className="p-2 border rounded"
      />
      <input
        type="text"
        name="you-postcode"
        placeholder="Your Postcode"
        value={formData["you-postcode"]}
        onChange={handleChange}
        required
        className="p-2 border rounded"
      />
      <textarea
        name="your-message"
        placeholder="Your Message"
        value={formData["your-message"]}
        onChange={handleChange}
        className="p-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 rounded"
      >
        {loading ? "Sending..." : "Send"}
      </button>

      {message && <p className="mt-2 text-sm">{message}</p>}
    </form>
  );
}
