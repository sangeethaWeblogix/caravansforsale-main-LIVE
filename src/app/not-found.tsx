"use client";
import { Button } from "@mui/material";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "404 not found";

  const robots = "noindex, nofollow";

  return {
    title: metaTitle,
    robots: robots,
    openGraph: {
      title: metaTitle,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
    },
  };
}

export default function NotFoundPage() {
  return (
    <>
      <style jsx>{`
        * {
          color: #fff;
          text-align: center;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body,
        .page {
          background: url("https://images.pexels.com/photos/974471/nature-night-sky-stars-974471.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940");
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          background-repeat: no-repeat;
          overflow: hidden;
          height: 100vh;
          width: 100%;
        }

        section {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        h1 {
          font-size: 150px;
        }

        .btn {
          padding: 15px;
          width: 200px;
          height: 60px;
          border-radius: 50px;
          border: none;
          outline: none;
          background: #fff;
          color: #000;
          font-size: 20px;
          margin-top: 50px;
          cursor: pointer;
        }

        #rocket {
          position: absolute;
          width: 80px;
        }

        @media only screen and (max-width: 600px) {
          h1 {
            font-size: 120px;
          }
        }
      `}</style>

      <div className="page">
        <section>
          <h1>404</h1>
          <h2>Page Not Found</h2>

          <p>We can&apos;t seem to find the page you&apos;re looking for.</p>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: "orange", // Set background to orange
                color: "white", // Make text white
                "&:hover": {
                  backgroundColor: "#ec7200", // Darker orange on hover
                },
              }}
            >
              Go to Home
            </Button>
          </Link>
        </section>
      </div>
    </>
  );
}
