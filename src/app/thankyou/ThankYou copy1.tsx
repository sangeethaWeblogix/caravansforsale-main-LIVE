"use client";
import React from "react";
import TickIcon from "../../../public/images/tick.jpg";
import Image from "next/image";
import Link from "next/link";

export default function SubmissionSuccess() {
  return (
    <div className="flex items-center justify-center   bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center">
        {/* Green Circle with Check Icon */}
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-green-500 mb-6">
          <Image
            src={TickIcon}
            alt="tick"
            width={40} // 👈 reduce size here
            height={40} // 👈 reduce size here
            className="object-contain"
          />
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Form submitted successfully!
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you! The form has been submitted successfully. <br />
          We will reply to you soon!
        </p>

        {/* Back Button */}
        <Link href="/" className="text-indigo-600 font-medium hover:underline">
          Go back
        </Link>
      </div>
    </div>
  );
}
