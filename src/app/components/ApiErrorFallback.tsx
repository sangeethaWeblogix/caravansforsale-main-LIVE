 "use client";
 
 import Link from "next/link";
 
 interface ApiErrorFallbackProps {
   title?: string;
   message?: string;
   showRetry?: boolean;
   errorType?: "network" | "api" | "empty" | "unknown";
 }
 
 export default function ApiErrorFallback({
   title = "Something went wrong",
   message = "We're having trouble loading this page. Please try again.",
   showRetry = true,
   errorType = "unknown",
 }: ApiErrorFallbackProps) {
   const handleRetry = () => {
     window.location.reload();
   };
 
   const getIcon = () => {
     switch (errorType) {
       case "network":
         return (
           <svg
             xmlns="http://www.w3.org/2000/svg"
             width="80"
             height="80"
             viewBox="0 0 24 24"
             fill="none"
             stroke="#6c757d"
             strokeWidth="1.5"
             strokeLinecap="round"
             strokeLinejoin="round"
           >
             <line x1="1" y1="1" x2="23" y2="23" />
             <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
             <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
             <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
             <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
             <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
             <line x1="12" y1="20" x2="12.01" y2="20" />
           </svg>
         );
       case "api":
         return (
           <svg
             xmlns="http://www.w3.org/2000/svg"
             width="80"
             height="80"
             viewBox="0 0 24 24"
             fill="none"
             stroke="#dc3545"
             strokeWidth="1.5"
             strokeLinecap="round"
             strokeLinejoin="round"
           >
             <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
             <line x1="8" y1="21" x2="16" y2="21" />
             <line x1="12" y1="17" x2="12" y2="21" />
             <line x1="7" y1="8" x2="7.01" y2="8" />
             <line x1="12" y1="8" x2="12.01" y2="8" />
             <line x1="17" y1="8" x2="17.01" y2="8" />
             <line x1="7" y1="12" x2="17" y2="12" />
           </svg>
         );
       case "empty":
         return (
           <svg
             xmlns="http://www.w3.org/2000/svg"
             width="80"
             height="80"
             viewBox="0 0 24 24"
             fill="none"
             stroke="#ffc107"
             strokeWidth="1.5"
             strokeLinecap="round"
             strokeLinejoin="round"
           >
             <circle cx="11" cy="11" r="8" />
             <line x1="21" y1="21" x2="16.65" y2="16.65" />
             <line x1="8" y1="11" x2="14" y2="11" />
           </svg>
         );
       default:
         return (
           <svg
             xmlns="http://www.w3.org/2000/svg"
             width="80"
             height="80"
             viewBox="0 0 24 24"
             fill="none"
             stroke="#dc3545"
             strokeWidth="1.5"
             strokeLinecap="round"
             strokeLinejoin="round"
           >
             <circle cx="12" cy="12" r="10" />
             <line x1="12" y1="8" x2="12" y2="12" />
             <line x1="12" y1="16" x2="12.01" y2="16" />
           </svg>
         );
     }
   };
 
   return (
     <section
       style={{
         minHeight: "80vh",
         background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
         padding: "40px 0",
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
       }}
     >
       <div
         style={{
           maxWidth: "1200px",
           margin: "0 auto",
           padding: "0 15px",
           width: "100%",
         }}
       >
         <div style={{ maxWidth: "600px", margin: "0 auto" }}>
           {/* Breadcrumb */}
           {/* <div
             style={{
               marginBottom: "24px",
               fontSize: "14px",
               color: "#6c757d",
             }}
           >
             <Link
               href="/"
               style={{ color: "#007bff", textDecoration: "none" }}
             >
               Home
             </Link>
             <span style={{ margin: "0 8px", color: "#adb5bd" }}>&gt;</span>
             <span style={{ color: "#495057", fontWeight: 500 }}>Listings</span>
           </div> */}
 
           {/* Error Card */}
           <div
             style={{
               background: "white",
               borderRadius: "16px",
               boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
               padding: "48px 40px",
               textAlign: "center",
             }}
           >
             {/* Icon with animation */}
             <div
               style={{
                 marginBottom: "24px",
                 animation: "pulse 2s ease-in-out infinite",
               }}
             >
               {getIcon()}
             </div>
 
             {/* Title */}
             <h1
               style={{
                 fontSize: "28px",
                 fontWeight: 700,
                 color: "#212529",
                 margin: "0 0 12px 0",
               }}
             >
               {title}
             </h1>
 
             {/* Message */}
             <p
               style={{
                 fontSize: "16px",
                 color: "#6c757d",
                 margin: "0 0 24px 0",
                 lineHeight: 1.6,
               }}
             >
               {message}
             </p>
 
             {/* Suggestions */}
             <div
               style={{
                 background: "#f8f9fa",
                 borderRadius: "8px",
                 padding: "20px",
                 marginBottom: "32px",
                 textAlign: "left",
               }}
             >
               <p
                 style={{
                   fontSize: "14px",
                   fontWeight: 600,
                   color: "#495057",
                   margin: "0 0 12px 0",
                 }}
               >
                 You can try:
               </p>
               <ul
                 style={{
                   margin: 0,
                   paddingLeft: "20px",
                   color: "#6c757d",
                   fontSize: "14px",
                 }}
               >
                 <li style={{ marginBottom: "6px" }}>
                   Checking your internet connection
                 </li>
                 <li style={{ marginBottom: "6px" }}>Refreshing the page</li>
                 <li>Coming back in a few minutes</li>
               </ul>
             </div>
 
             {/* Action Buttons */}
             <div
               style={{
                 display: "flex",
                 flexDirection: "row",
                 gap: "12px",
                 alignItems: "center",
                 justifyContent: "center",
                 flexWrap: "wrap",
               }}
             >
               {showRetry && (
                 <button
                   onClick={handleRetry}
                   style={{
                     display: "inline-flex",
                     alignItems: "center",
                     justifyContent: "center",
                     padding: "14px 28px",
                     fontSize: "16px",
                     fontWeight: 500,
                     borderRadius: "8px",
                     cursor: "pointer",
                     transition: "all 0.2s ease",
                     textDecoration: "none",
                     minWidth: "160px",
                     background: "#007bff",
                     color: "white",
                     border: "none",
                   }}
                 >
                   <svg
                     xmlns="http://www.w3.org/2000/svg"
                     width="18"
                     height="18"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     style={{ marginRight: "8px" }}
                   >
                     <polyline points="23 4 23 10 17 10" />
                     <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                   </svg>
                   Try Again
                 </button>
               )}
 
               <Link
                 href="/"
                 style={{
                   display: "inline-flex",
                   alignItems: "center",
                   justifyContent: "center",
                   padding: "14px 28px",
                   fontSize: "16px",
                   fontWeight: 500,
                   borderRadius: "8px",
                   cursor: "pointer",
                   transition: "all 0.2s ease",
                   textDecoration: "none",
                   minWidth: "160px",
                   background: "white",
                   color: "#495057",
                   border: "2px solid #dee2e6",
                 }}
               >
                 <svg
                   xmlns="http://www.w3.org/2000/svg"
                   width="18"
                   height="18"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   style={{ marginRight: "8px" }}
                 >
                   <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                   <polyline points="9 22 9 12 15 12 15 22" />
                 </svg>
                 Go to Homepage
               </Link>
             </div>
 
             {/* Contact Support */}
             <div
               style={{
                 marginTop: "32px",
                 paddingTop: "24px",
                 borderTop: "1px solid #e9ecef",
               }}
             >
               <p style={{ fontSize: "14px", color: "#6c757d", margin: 0 }}>
                 Need help?{" "}
                 <Link
                   href="/contact"
                   style={{ color: "#007bff", textDecoration: "none" }}
                 >
                   Contact our support team
                 </Link>
               </p>
             </div>
           </div>
         </div>
       </div>
 
       {/* CSS Animation for icon pulse */}
       <style jsx>{`
         @keyframes pulse {
           0%,
           100% {
             opacity: 1;
             transform: scale(1);
           }
           50% {
             opacity: 0.7;
             transform: scale(0.95);
           }
         }
       `}</style>
     </section>
   );
 }
 