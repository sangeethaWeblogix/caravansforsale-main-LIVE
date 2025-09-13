"use client";
import React from "react";
import { Card, CardContent, Typography, Button } from "@mui/material";
import Link from "next/link";
import TickIcon from "../../../public/images/tick.jpg";
import Image from "next/image";
export default function SubmissionSuccess() {
  return (
    <div
      style={{
        minHeight: "80vh", // keeps space between header and footer
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: 5,
          maxWidth: 500,
          textAlign: "center",
        }}
      >
        <CardContent>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 20px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src={TickIcon}
              alt="Success"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
            />
          </div>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Thank you for submitting your information with{" "}
            <span style={{ color: "#000" }}>caravansforsale.com.au</span>.
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            Your caravan dealer will contact you as soon as possible.
          </Typography>

          <Link href="/" style={{ textDecoration: "none" }}>
            <Button variant="contained" color="primary" sx={{ mt: 3 }}>
              Go back
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
