"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// Fancybox
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { useEffect } from "react";

export default function CaravanInfo() {
    useEffect(() => {
        // Bind Fancybox
        Fancybox.bind("[data-fancybox='gallery']", {
            Thumbs: false,
            Toolbar: true,
        });

        return () => {
            // Cleanup
            Fancybox.destroy();
        };
    }, []);
    return (
        <section className="details_top section-padding">
            <div className="container">
                <div className="row justify-content-center">
                    {/* Main Content */}
                    <div className="col-lg-9">
                        <div className="section-head">
                            <h1 className="uppercase divide-orange">
                                <span className="color-orange">Calibra</span> - FULL OFF ROAD
                            </h1>
                            <p>
                                Traveling with three kids and need space for adventure? The 20.6F
                                CALIBRA offers all the quality, style, and features of an
                                Everest, with a full ensuite, spacious living area, and off-road
                                capabilities. It&apos;s perfect for family getaways, so pack up
                                and experience it—just be warned, the kids might not want to
                                leave!
                            </p>
                            <div className="img text-center main_range_img">
                                <Image
                                    src="https://www.admin.caravansforsale.com.au/wp-content/uploads/2023/08/1-17.png"
                                    alt="Calibra Caravan"
                                    width={800}
                                    height={400}
                                    className="main-img"
                                />
                            </div>
                        </div>

                        {/* Specifications */}
                        <div className="challenge section-padding pt-0 pb-0 style-5 overflow-hidden">
                            <div className="section-head desing2 style-4">
                                <h2 className="mb-30">SPECIFICATIONS</h2>
                            </div>
                            <div className="inf">
                                <div className="info_body">
                                    <h3>CHASSIS AND RUNNING GEAR</h3>
                                    <ul>
                                        <li>Chassis – Supergal Australian RHS Steel Chassis</li>
                                        <li>Hitch – Full Articulated Off-Road Tow Hitch</li>
                                        <li>
                                            A – Frame – 6” Extended A Frame with RHS Australian made
                                            Steel
                                        </li>
                                        <li>
                                            Deck – 9” Chassis – 6′ deck x3 raiser” Chassis, RHS
                                            Australian Steel
                                        </li>
                                        <li>
                                            Suspension – 3.5 T Oz Trekker Suspension Full Offroad
                                            Independent Suspension
                                        </li>
                                        <li>
                                            Shockers – Pedder’s Suspension Trak Ryder Dual Shock
                                            Absorbers &amp; Spring
                                        </li>
                                        <li>Bumper – 4 Arm Heavy Duty Steel Bumper (Rear)</li>
                                        <li>Jerry Can Holders – 2 x Black Rear Mounted</li>
                                        <li>
                                            Stabilising Legs – 4 x Heavy Duty Stabilising Corner Legs
                                        </li>
                                        <li>
                                            Spare Wheel – 1x R16” 265/75 Rims and Off-Road ALL Terrain
                                            Tyres /Optional Mud Terrain Tyres
                                        </li>
                                        <li>
                                            Wheels – 5 x R16” 265/75 Rims and Off-Road ALL Terrain
                                            Tyres
                                        </li>
                                        <li>
                                            Jockey Wheel – 8″ Alko Heavy Duty Centre Mounted Jockey
                                            Wheel
                                        </li>
                                        <li>Brakes – 12″ Electric</li>
                                        <li>Battery Box – Dual Heavy Duty Steel Box</li>
                                        <li>Jack Corner Supports – 4</li>
                                        <li>Jack – Kojack</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="challenge section-padding pt-0 pb-0 style-5 overflow-hidden">
                            <div className="section-head desing2 style-4">
                                <h2 className="mb-30">DESCRIPTION</h2>
                            </div>
                            <div className="inf">
                                <div className="range_dec">
                                    <h3>Calibra – Ultimate Off-Road Family Caravan</h3>
                                    <p>
                                        The Calibra 20.6F is designed for families who crave
                                        adventure without sacrificing comfort. Featuring a robust
                                        build, spacious interiors, and premium off-road
                                        capabilities, it’s perfect for exploring rugged terrains
                                        while enjoying modern luxuries.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Floorplans */}
                        <div className="projects style-8 floorplan">
                            <div className="section-head style-8 mb-20">
                                <h3>FLOOR PLANS</h3>
                                <div className="arrows">
                                    <div className="swiper-button-next">
                                        <i className="fal fa-long-arrow-right"></i>
                                    </div>
                                    <div className="swiper-button-prev">
                                        <i className="fal fa-long-arrow-left"></i>
                                    </div>
                                </div>
                            </div>
                            <div className="content">
                                <Swiper
                                    modules={[Navigation]}
                                    navigation={{
                                        nextEl: ".swiper-button-next",
                                        prevEl: ".swiper-button-prev",
                                    }}
                                    spaceBetween={20}
                                    slidesPerView={1}
                                    loop
                                >
                                    {[
                                        "https://www.admin.caravansforsale.com.au/wp-content/uploads/2023/08/CALIBRA-20.6-F-Full-Off-Road-L-SHAPE-01-01-1536x663-1.jpg",
                                        "https://www.admin.caravansforsale.com.au/wp-content/uploads/2023/08/CALIBRA-20.6-F-Full-Off-Road-L-SHAPE-02-01-1536x663-1.jpg",
                                    ].map((src, idx) => (
                                        <SwiperSlide key={idx}>
                                            <div className="project-card">
                                                <h4 className="title">20.6 - 22.6 F CALIBRA</h4>
                                                <div className="img">
                                                    <Image
                                                        src={src}
                                                        alt={`Calibra floorplan ${idx + 1}`}
                                                        width={800}
                                                        height={400}
                                                        className="main-img"
                                                    />
                                                </div>
                                                <div className="info">
                                                    <div className="proj-det">
                                                        <div className="item">
                                                            <p>ATM</p>
                                                            <h6>3500-4400</h6>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                            <p
                                className="mb-20"
                                style={{
                                    color: "#0d6efd",
                                    textDecoration: "underline",
                                    fontSize: "20px",
                                }}
                            >
                                <Link
                                    href="https://www.everestcaravans.com.au/range/calibra/"
                                    target="_blank"
                                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                                >
                                    Visit Everest Caravans
                                </Link>
                            </p>
                        </div>

                        {/* Gallery */}
                        <div className="projects style-6 p-0 bg-black">
                            <div className="content section-padding rounded-0">
                                <h3>Calibra Gallery</h3>
                                <div className="info_gallery">
                                    <ul id="banners_grid" className="clearfix">
                                        {[
                                            "https://www.admin.caravansforsale.com.au/wp-content/uploads/2023/08/1-10.jpg",
                                            "https://www.admin.caravansforsale.com.au/wp-content/uploads/2023/08/2-8.jpg",
                                            "https://www.admin.caravansforsale.com.au/wp-content/uploads/2023/08/3-14.jpg",
                                        ].map((src, idx) => (
                                            <li key={idx}>
                                                <a
                                                    href={src}
                                                    data-fancybox="gallery"
                                                    className="img_container"
                                                >
                                                    <Image
                                                        src={src}
                                                        alt={`Calibra gallery ${idx + 1}`}
                                                        width={400}
                                                        height={300}
                                                        className="lazy"
                                                    />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="col-lg-3 rightbar-stick hidden-xs hidden-sm">
                        <div className="theiaStickySidebar">

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
