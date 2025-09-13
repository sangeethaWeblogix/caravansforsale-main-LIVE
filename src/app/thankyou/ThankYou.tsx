"use client";
import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline"; // using Heroicons
import Link from "next/link";

export default function SubmissionSuccess() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md text-center">
        {/* Green Tick Icon */}
        <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />

        {/* Success Message */}
        <h2 className="text-2xl font-semibold text-green-600 mb-2">
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
