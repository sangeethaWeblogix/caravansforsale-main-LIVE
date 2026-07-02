import Image from "next/image";

const REGIONS = [
  { name: "Melbourne",            href: "/listings/caravans-for-sale-in-melbourne/" },
  { name: "Geelong",              href: "/listings/caravans-for-sale-in-geelong/" },
  { name: "Ballarat",             href: "/listings/caravans-for-sale-in-ballarat/" },
  { name: "Bendigo",              href: "/listings/caravans-for-sale-in-bendigo/" },
  { name: "Gippsland",            href: "/listings/caravans-for-sale-in-gippsland/" },
  { name: "Shepparton",           href: "/listings/caravans-for-sale-in-shepparton/" },
  { name: "Mornington Peninsula", href: "/listings/caravans-for-sale-in-mornington-peninsula/" },
  { name: "Pakenham",             href: "/listings/caravans-for-sale-in-pakenham/" },
  { name: "Campbellfield",        href: "/listings/caravans-for-sale-in-campbellfield/" },
  { name: "Dandenong",            href: "/listings/caravans-for-sale-in-dandenong/" },
  { name: "Bayswater",            href: "/listings/caravans-for-sale-in-bayswater/" },
  { name: "Traralgon",            href: "/listings/caravans-for-sale-in-traralgon/" },
];

const TYPES = [
  { label: "Off Road Caravans", href: "/listings/off-road-category/?state=victoria" },
  { label: "Luxury Caravans",   href: "/listings/luxury-category/?state=victoria" },
  { label: "Hybrid Caravans",   href: "/listings/hybrid-category/?state=victoria" },
  { label: "Pop Top Caravans",  href: "/listings/pop-top-category/?state=victoria" },
  { label: "Touring Caravans",  href: "/listings/touring-category/?state=victoria" },
  { label: "Family Caravans",   href: "/listings/family-category/?state=victoria" },
];

const FILTERS = [
  {
    icon: "/images/Budget.png", title: "By Budget",
    links: [
      { text: "Under $50k",  href: "/listings/?max_price=50000&state=victoria" },
      { text: "Under $75k",  href: "/listings/?max_price=75000&state=victoria" },
      { text: "Under $100k", href: "/listings/?max_price=100000&state=victoria" },
      { text: "Over $100k",  href: "/listings/?min_price=100000&state=victoria" },
    ],
  },
  {
    icon: "/images/ATM.png", title: "By Weight (ATM)",
    links: [
      { text: "Under 2000kg",    href: "/listings/?max_atm=2000&state=victoria" },
      { text: "2000kg – 2500kg", href: "/listings/?min_atm=2000&max_atm=2500&state=victoria" },
      { text: "2500kg – 3000kg", href: "/listings/?min_atm=2500&max_atm=3000&state=victoria" },
      { text: "Over 3000kg",     href: "/listings/?min_atm=3000&state=victoria" },
    ],
  },
  {
    icon: "/images/Length.png", title: "By Size (Length)",
    links: [
      { text: "Under 18ft",  href: "/listings/?max_length=18&state=victoria" },
      { text: "18ft – 20ft", href: "/listings/?min_length=18&max_length=20&state=victoria" },
      { text: "20ft – 22ft", href: "/listings/?min_length=20&max_length=22&state=victoria" },
      { text: "Over 22ft",   href: "/listings/?min_length=22&state=victoria" },
    ],
  },
  {
    icon: "/images/Sleeping.png", title: "By Sleeping Capacity",
    links: [
      { text: "2 Berth",           href: "/listings/2-berth-caravans/?state=victoria" },
      { text: "3 – 4 Berth",       href: "/listings/3-4-berth-caravans/?state=victoria" },
      { text: "5 – 6 Berth",       href: "/listings/5-6-berth-caravans/?state=victoria" },
      { text: "Family (7+ Berth)", href: "/listings/7-plus-berth-caravans/?state=victoria" },
    ],
  },
];

export default function StateBrowseSection() {
  return (
    <section className="lsd-browse">
      <div className="container">

        {/* Row 1 — Region + Type */}
        <div className="lsd-browse__row1">
          <div className="lsd-browse__panel">
            <h3 className="lsd-browse__panel-title">Browse by Region</h3>
            <div className="lsd-browse__pills">
              {REGIONS.map((r) => (
                <a key={r.name} href={r.href} className="lsd-browse__pill">{r.name}</a>
              ))}
            </div>
            
          </div>

          <div className="lsd-browse__divider-v" />

          <div className="lsd-browse__panel">
            <h3 className="lsd-browse__panel-title">Browse by Type</h3>
            <div className="lsd-browse__type-grid">
              {TYPES.map((t) => (
                <a key={t.label} href={t.href} className="lsd-browse__type-card">{t.label}</a>
              ))}
            </div>
            
          </div>
        </div>

        {/* Row 2 — 4 Filter columns */}
        <div className="lsd-browse__row2">
          {FILTERS.map((f) => (
            <div key={f.title} className="lsd-browse__filter-col">
              <div className="lsd-browse__filter-head">
                <Image src={f.icon} alt={f.title} width={20} height={20} unoptimized />
                <span className="lsd-browse__filter-title">{f.title}</span>
              </div>
              <div className="lsd-browse__filter-links">
                {f.links.map((l) => (
                  <a key={l.text} href={l.href} className="lsd-browse__filter-link">{l.text}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
