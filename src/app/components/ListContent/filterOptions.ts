export const filterOptions = {
  categories: [
    { name: "Off Road", slug: "/off-road-category/" },
    { name: "Family", slug: "/family-category/" },
    { name: "Touring", slug: "/touring-category/" },
    { name: "Luxury", slug: "/luxury-category/" },
    { name: "Pop Top", slug: "/pop-top-category/" },
    { name: "Hybrid", slug: "/hybrid-category/" },
  ],
  price: [
    { name: "under 20k", slug: "/under-20000/" },
    { name: "20k-30k", slug: "/between-20000-30000/" },
    { name: "30k-40k", slug: "/between-30000-40000/" },
    { name: "40k-50k", slug: "/between-40000-50000/" },
    { name: "50k-70k", slug: "/between-50000-70000/" },
    { name: "70k-100k", slug: "/between-70000-100000/" },
    { name: "100k-150k", slug: "/between-100000-150000/" },
    { name: "150k-200k", slug: "/between-150000-200000/" },
    { name: "over 200k", slug: "/over-200000/" },
  ],
  atm: [
    { name: "Under 1500kg", slug: "/under-1500-kg-atm/" },
    { name: "1500kg-2500kg", slug: "/between-1500-kg-2500-kg-atm/" },
    { name: "2500kg-3500kg", slug: "/between-2500-kg-3500-kg-atm/" },
    { name: "3500kg-4500kg", slug: "/between-3500-kg-4500-kg-atm/" },
    { name: "Over 4500kg", slug: "/over-4500-kg-atm/" },
  ],
  sleep: [
    { name: "Sleeps 1-2", slug: "/between-1-2-people-sleeping-capacity/" },
    { name: "Sleeps 3-4", slug: "/between-3-4-people-sleeping-capacity/" },
    { name: "Sleeps 4-6", slug: "/between-4-6-people-sleeping-capacity/" },
    { name: "Over 6 Sleeps", slug: "/over-6-people-sleeping-capacity/" },
  ],
  length: [
    { name: "Under 12ft", slug: "/under-12-length-in-feet/" },
    { name: "12ft-14ft", slug: "/between-12-14-length-in-feet/" },
    { name: "15ft-17ft", slug: "/between-15-17-length-in-feet/" },
    { name: "18ft-20ft", slug: "/between-18-20-length-in-feet/" },
    { name: "21ft-23ft", slug: "/between-21-23-length-in-feet/" },
    { name: "Over 24ft", slug: "/over-24-length-in-feet/" },
  ],
  location: {
    state: [
      {
        name: "Australian Capital Territory",
        slug: "/australian-capital-territory-state/",
        region: [
          {
            name: "Australian Capital Territory",
            slug: "/australian-capital-territory-region/",
          },
        ],
      },
      {
        name: "New South Wales",
        slug: "/new-south-wales-state/",
        region: [
          { name: "Sydney", slug: "/sydney-region/" },
          { name: "Hunter", slug: "/hunter-region/" },
          {
            name: "Coffs Harbour",
            slug: "/coffs-harbour-region/",
          },
          {
            name: "Newcastle",
            slug: "/newcastle-region/",
          },
          {
            name: "Southern Highlands",
            slug: "/southern-highlands-region/",
          },
          {
            name: "Richmond Tweed",
            slug: "/richmond-tweed-region/",
          },
          {
            name: "Central Coast",
            slug: "/central-coast-region/",
          },
          {
            name: "Central West",
            slug: "/central-west-region/",
          },
          {
            name: "Mid North Coast",
            slug: "/mid-north-coast-region/",
          },
          { name: "Murray", slug: "/murray-region/" },
          {
            name: "New England",
            slug: "/new-england-region/",
          },
          { name: "Riverina", slug: "/riverina-region/" },
          { name: "Capital", slug: "/capital-region/" },
          { name: "Orana", slug: "/orana-region/" },
          {
            name: "Illawarra",
            slug: "/illawarra-region/",
          },
        ],
      },
      {
        name: "Northern Territory",
        slug: "/northern-territory-state/",
        region: [{ name: "Darwin", slug: "/darwin-region/" }],
      },
      {
        name: "Queensland",
        slug: "/queensland-state/",
        region: [
          {
            name: "Moreton Bay North",
            slug: " /moreton-bay-north-region/",
          },
          { name: "Wide Bay", slug: "/wide-bay-region/" },
          { name: "Gold Coast", slug: "/gold-coast-region/" },
          { name: "Brisbane", slug: "/brisbane-region/" },
          {
            name: "Sunshine Coast",
            slug: "/sunshine-coast-region/",
          },
          {
            name: "Logan Beaudesert",
            slug: "/logan-beaudesert-region/",
          },
          {
            name: "Moreton Bay South",
            slug: "/moreton-bay-south-region/",
          },
          { name: "Townsville", slug: "/townsville-region/" },
          {
            name: "Mackay Isaac Whitsunday",
            slug: "/mackay-isaac-whitsunday-region/",
          },
          { name: "Ipswich", slug: "/ipswich-region/" },
          { name: "Toowoomba", slug: "/toowoomba-region/" },
          { name: "Cairns", slug: "/cairns-region/" },
        ],
      },
      {
        name: "South Australia",
        slug: "/south-australia-state/",
        region: [
          { name: "Adelaide", slug: "/adelaide-region/" },
          {
            name: "South Australia South East",
            slug: "/south-australia-south-east-region/",
          },
        ],
      },
      {
        name: "Tasmania",
        slug: "/tasmania-state/",
        region: [
          { name: "North West", slug: "/north-west-region/" },
          { name: "Hobart", slug: "/hobart-region/" },
          { name: "Launceston", slug: "/launceston-region/" },
        ],
      },
      {
        name: "Victoria",
        slug: "/victoria-state/",
        region: [
          { name: "Melbourne", slug: "/melbourne-region/" },
          { name: "Ballarat", slug: "/ballarat-region/" },
          { name: "Geelong", slug: "/geelong-region/" },
          { name: "Shepparton", slug: "/shepparton-region/" },
          {
            name: "Latrobe Gippsland",
            slug: "/latrobe-gippsland-region/",
          },
          { name: "Bendigo", slug: "/bendigo-region/" },
          {
            name: "Mornington Peninsula",
            slug: "/mornington-peninsula-region/",
          },
          { name: "Hume", slug: "/hume-region/" },
          { name: "North West", slug: "/north-west-region/" },
          {
            name: "Warrnambool And South West",
            slug: "/warrnambool-and-south-west-region/",
          },
        ],
      },
      {
        name: "Western Australia",
        slug: "/western-australia-state/",
        region: [
          { name: "Perth", slug: "/perth-region/" },
          {
            name: "Mandurah",
            slug: "/mandurah-region/",
          },
          {
            name: "Western Australia Outback South",
            slug: "/western-australia-outback-south-region/",
          },
          { name: "Bunbury", slug: "/bunbury-region/" },
        ],
      },
    ],
  },
};
