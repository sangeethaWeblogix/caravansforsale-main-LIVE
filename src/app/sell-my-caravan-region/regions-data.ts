import { Metadata } from "next";

export interface StateInfo {
  slug: string;
  label: string;
}

export interface RegionInfo {
  slug: string;
  label: string;
  state: StateInfo;
}

export const STATES = {
  victoria: { slug: "victoria", label: "Victoria" },
  "new-south-wales": { slug: "new-south-wales", label: "New South Wales" },
  queensland: { slug: "queensland", label: "Queensland" },
  tasmania: { slug: "tasmania", label: "Tasmania" },
  "south-australia": { slug: "south-australia", label: "South Australia" },
  "western-australia": { slug: "western-australia", label: "Western Australia" },
} as const satisfies Record<string, StateInfo>;

type StateKey = keyof typeof STATES;

function region(slug: string, label: string, stateKey: StateKey): RegionInfo {
  return { slug, label, state: STATES[stateKey] };
}

export const ALL_REGIONS: RegionInfo[] = [
  // Victoria
  region("melbourne-region", "Melbourne", "victoria"),
  region("geelong-region", "Geelong", "victoria"),
  region("ballarat-region", "Ballarat", "victoria"),
  region("latrobe-gippsland-region", "Latrobe Gippsland", "victoria"),
  region("mornington-peninsula-region", "Mornington Peninsula", "victoria"),
  region("shepparton-region", "Shepparton", "victoria"),
  region("hume-region", "Hume", "victoria"),
  region("bendigo-region", "Bendigo", "victoria"),
  region("north-west-region", "North West", "victoria"),
  region("warrnambool-and-south-west-region", "Warrnambool And South West", "victoria"),

  // New South Wales
  region("sydney-region", "Sydney", "new-south-wales"),
  region("hunter-region", "Hunter", "new-south-wales"),
  region("coffs-harbour-region", "Coffs Harbour", "new-south-wales"),
  region("newcastle-region", "Newcastle", "new-south-wales"),
  region("southern-highlands-region", "Southern Highlands", "new-south-wales"),
  region("richmond-tweed-region", "Richmond Tweed", "new-south-wales"),
  region("central-coast-region", "Central Coast", "new-south-wales"),
  region("central-west-region", "Central West", "new-south-wales"),
  region("mid-north-coast-region", "Mid North Coast", "new-south-wales"),
  region("murray-region", "Murray", "new-south-wales"),
  region("new-england-region", "New England", "new-south-wales"),
  region("riverina-region", "Riverina", "new-south-wales"),
  region("capital-region", "Capital", "new-south-wales"),
  region("orana-region", "Orana", "new-south-wales"),
  region("illawarra-region", "Illawarra", "new-south-wales"),
  region("canberra-region", "Canberra", "new-south-wales"),

  // Queensland
  region("moreton-bay-north-region", "Moreton Bay North", "queensland"),
  region("wide-bay-region", "Wide Bay", "queensland"),
  region("gold-coast-region", "Gold Coast", "queensland"),
  region("brisbane-region", "Brisbane", "queensland"),
  region("sunshine-coast-region", "Sunshine Coast", "queensland"),
  region("logan-beaudesert-region", "Logan Beaudesert", "queensland"),
  region("moreton-bay-south-region", "Moreton Bay South", "queensland"),
  region("townsville-region", "Townsville", "queensland"),
  region("mackay-isaac-whitsunday-region", "Mackay Isaac Whitsunday", "queensland"),
  region("ipswich-region", "Ipswich", "queensland"),
  region("toowoomba-region", "Toowoomba", "queensland"),
  region("cairns-region", "Cairns", "queensland"),

  // Tasmania — "north-west-region" is taken by Victoria's North West, so
  // Tasmania's North West is prefixed to keep every region slug unique.
  region("tasmania-north-west-region", "North West", "tasmania"),
  region("hobart-region", "Hobart", "tasmania"),
  region("launceston-region", "Launceston", "tasmania"),

  // South Australia
  region("adelaide-region", "Adelaide", "south-australia"),
  region("south-australia-south-east-region", "South Australia South East", "south-australia"),

  // Western Australia
  region("perth-region", "Perth", "western-australia"),
  region("mandurah-region", "Mandurah", "western-australia"),
  region("western-australia-outback-south-region", "Western Australia Outback South", "western-australia"),
  region("bunbury-region", "Bunbury", "western-australia"),
];

export function getRegionBySlug(slug: string): RegionInfo | undefined {
  return ALL_REGIONS.find((r) => r.slug === slug);
}

export function getRegionsByState(stateSlug: StateKey): RegionInfo[] {
  return ALL_REGIONS.filter((r) => r.state.slug === stateSlug);
}

const BASE_URL = "https://www.caravansforsale.com.au";

export function buildRegionMetadata(region: RegionInfo): Metadata {
  return {
    title: {
      default: `Sell My Caravan in ${region.label} for $49 Until Sold | CaravansForSale.com.au`,
      template: "%s ",
    },
    description: `Sell your caravan in ${region.label}, ${region.state.label} on CaravansForSale.com.au for just $49 until sold. No subscriptions, no commissions, and connect directly with caravan buyers in ${region.label}.`,
    icons: { icon: "/favicon.ico" },
    robots: "noindex, nofollow",
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
    },
    alternates: {
      canonical: `${BASE_URL}/sell-my-caravan-${region.slug}/`,
    },
  };
}

export function buildRegionJsonLd(region: RegionInfo) {
  const pageUrl = `${BASE_URL}/sell-my-caravan-${region.slug}/`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `Sell My Caravan in ${region.label} | $49 Until Sold`,
        description: `Sell your caravan in ${region.label}, ${region.state.label} with CaravansForSale.com.au. List your caravan for a one-time $49 fee, keep 100% of the sale price, and stay live until sold.`,
        inLanguage: "en-AU",
        isPartOf: { "@id": `${BASE_URL}/#website` },
      },
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: "Private Caravan Listing Service",
        url: pageUrl,
        description: `List your caravan for sale on CaravansForSale.com.au for a one-time $49 fee. No commissions, no subscriptions, live until sold.`,
        provider: {
          "@type": "Organization",
          name: "Caravans For Sale",
          url: BASE_URL,
        },
        areaServed: {
          "@type": "Place",
          name: `${region.label}, ${region.state.label}`,
        },
        offers: {
          "@type": "Offer",
          price: "49",
          priceCurrency: "AUD",
          description: "One-time listing fee, live until sold, no commissions",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faqpage`,
        mainEntity: [
          {
            "@type": "Question",
            name: `How do I sell my caravan in ${region.label}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `You can sell your caravan in ${region.label} by creating a private seller listing on CaravansForSale.com.au. Add your caravan details, upload clear photos, set your asking price and publish your ad so buyers in ${region.label} and across ${region.state.label} can contact you directly.`,
            },
          },
          {
            "@type": "Question",
            name: `How much does it cost to sell my caravan in ${region.label}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "It costs $49 inc. GST to list your caravan on CaravansForSale.com.au. This is a one-time listing fee with no monthly subscription, no hidden charges and no commission when your caravan sells.",
            },
          },
          {
            "@type": "Question",
            name: "How long does my caravan listing stay live?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Your caravan listing stays live until sold. You do not need to keep paying monthly fees to keep your ad active. Once your caravan is sold, you can remove the listing from the website.",
            },
          },
          {
            "@type": "Question",
            name: "Can I edit my caravan listing after publishing?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. After your listing is published, you can update your caravan details, change the asking price, add or replace photos and improve your description if needed.",
            },
          },
          {
            "@type": "Question",
            name: "How do buyers contact me?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Interested buyers can contact you directly through your caravan listing. This allows you to answer questions, arrange inspections, negotiate the price and manage the sale privately.",
            },
          },
          {
            "@type": "Question",
            name: "Do I pay commission when my caravan sells?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. CaravansForSale.com.au does not charge commission when your caravan sells. You pay the one-time listing fee and keep 100% of the agreed sale price.",
            },
          },
          {
            "@type": "Question",
            name: "How should I price my caravan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `Check similar caravans for sale in ${region.label} before setting your price. Compare by make, model, year, condition, length, ATM, tare weight, sleeping capacity, features and location. A realistic asking price can help attract more genuine buyers.`,
            },
          },
          {
            "@type": "Question",
            name: "Is it safe to sell my caravan privately online?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes, but you should take normal precautions. Speak with buyers directly, meet in a safe location, confirm payment has cleared before handover and complete any required transfer paperwork for ${region.state.label}.`,
            },
          },
          {
            "@type": "Question",
            name: "Can I remove my listing after my caravan is sold?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Once your caravan has sold, you can remove your listing so buyers know it is no longer available.",
            },
          },
        ],
      },
    ],
  };
}
