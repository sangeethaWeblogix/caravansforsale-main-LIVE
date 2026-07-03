import SellerWesternAustralia from "./seller";
import "../sell-my-caravan-new/seller.css";
import "./western-australia.css";

const BASE_URL = "https://www.caravansforsale.com.au";

const sellPageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/sell-my-caravan-western-australia/#webpage`,
      "url": `${BASE_URL}/sell-my-caravan-western-australia/`,
      "name": "Sell My Caravan in Western Australia | $49 Until Sold",
      "description":
        "Sell your caravan in Western Australia with CaravansForSale.com.au. List your caravan for a one-time $49 fee, keep 100% of the sale price, and stay live until sold.",
      "inLanguage": "en-AU",
      "isPartOf": { "@id": `${BASE_URL}/#website` },
    },
    {
      "@type": "Service",
      "@id": `${BASE_URL}/sell-my-caravan-western-australia/#service`,
      "name": "Private Caravan Listing Service",
      "url": `${BASE_URL}/sell-my-caravan-western-australia/`,
      "description":
        "List your caravan for sale on CaravansForSale.com.au for a one-time $49 fee. No commissions, no subscriptions, live until sold.",
      "provider": {
        "@type": "Organization",
        "name": "Caravans For Sale",
        "url": BASE_URL,
      },
      "areaServed": {
        "@type": "State",
        "name": "Western Australia",
      },
      "offers": {
        "@type": "Offer",
        "price": "49",
        "priceCurrency": "AUD",
        "description": "One-time listing fee, live until sold, no commissions",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${BASE_URL}/sell-my-caravan-western-australia/#faqpage`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I sell my caravan in Western Australia?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can sell your caravan in Western Australia by creating a private seller listing on CaravansForSale.com.au. Add your caravan details, upload clear photos, set your asking price and publish your ad so buyers across Perth and regional Western Australia can contact you directly.",
          },
        },
        {
          "@type": "Question",
          "name": "How much does it cost to sell my caravan in Western Australia?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It costs $49 inc. GST to list your caravan on CaravansForSale.com.au. This is a one-time listing fee with no monthly subscription, no hidden charges and no commission when your caravan sells.",
          },
        },
        {
          "@type": "Question",
          "name": "How long does my caravan listing stay live?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Your caravan listing stays live until sold. You do not need to keep paying monthly fees to keep your ad active. Once your caravan is sold, you can remove the listing from the website.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I edit my caravan listing after publishing?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. After your listing is published, you can update your caravan details, change the asking price, add or replace photos and improve your description if needed.",
          },
        },
        {
          "@type": "Question",
          "name": "How do buyers contact me?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Interested buyers can contact you directly through your caravan listing. This allows you to answer questions, arrange inspections, negotiate the price and manage the sale privately.",
          },
        },
        {
          "@type": "Question",
          "name": "Do I pay commission when my caravan sells?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. CaravansForSale.com.au does not charge commission when your caravan sells. You pay the one-time listing fee and keep 100% of the agreed sale price.",
          },
        },
        {
          "@type": "Question",
          "name": "How should I price my caravan?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Check similar caravans for sale in Western Australia before setting your price. Compare by make, model, year, condition, length, ATM, tare weight, sleeping capacity, features and location. A realistic asking price can help attract more genuine buyers.",
          },
        },
        {
          "@type": "Question",
          "name": "Is it safe to sell my caravan privately online?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, but you should take normal precautions. Speak with buyers directly, meet in a safe location, confirm payment has cleared before handover and complete any required transfer paperwork for Western Australia.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I remove my listing after my caravan is sold?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Once your caravan has sold, you can remove your listing so buyers know it is no longer available.",
          },
        },
      ],
    },
  ],
};

export default function SellMyCaravanWesternAustralia() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sellPageJsonLd) }}
      />
      <SellerWesternAustralia />
    </>
  );
}
