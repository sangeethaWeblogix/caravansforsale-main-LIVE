"use client";
import Link from "next/link";
import React, { useEffect } from "react";

export default function NotFoundPage() {
  //   useEffect(() => {
  //     // Click event → add star
  //     const handleClick = (e: MouseEvent) => {
  //       const star = document.createElement("img");
  //       star.src =
  //         "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Golden_star.svg/1200px-Golden_star.svg.png";
  //       star.style.width = "35px";
  //       star.style.position = "absolute";
  //       star.style.left = `${e.pageX}px`;
  //       star.style.top = `${e.pageY}px`;
  //       document.body.appendChild(star);

  //       // remove after 2s
  //       setTimeout(() => star.remove(), 2000);
  //     };

  //     // Mouse move → rocket follows
  //     const handleMouseMove = (e: MouseEvent) => {
  //       const rocket = document.getElementById("rocket");
  //       if (rocket) {
  //         rocket.style.left = `${e.pageX}px`;
  //         rocket.style.top = `${e.pageY}px`;
  //       }
  //     };

  //     window.addEventListener("click", handleClick);
  //     window.addEventListener("mousemove", handleMouseMove);

  //     return () => {
  //       window.removeEventListener("click", handleClick);
  //       window.removeEventListener("mousemove", handleMouseMove);
  //     };
  //   }, []);

  return (
    <>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins&display=swap");

        * {
          font-family: Poppins, sans-serif;
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
          <h2>Oops! It looks like you have lost</h2>
          <Link href="/">
            <button className="btn pt-6">Go to Home</button>
          </Link>
        </section>

        {/* Rocket image */}
        <img src="/amri.png" id="rocket" alt="rocket" />
      </div>
    </>
  );
}
