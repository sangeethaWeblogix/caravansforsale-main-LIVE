import Image from "next/image";
import { getRegionsByState } from "../sell-my-caravan-region/regions-data";

const STATES = [
  { name: "Victoria",            href: "/listings/victoria-state/" },
  { name: "New South Wales",     href: "/listings/new-south-wales-state/" },
  { name: "Queensland",          href: "/listings/queensland-state/" },
  { name: "South Australia",     href: "/listings/south-australia-state/" },
  { name: "Western Australia",   href: "/listings/western-australia-state/" },
  { name: "Tasmania",            href: "/listings/tasmania-state/" },
];

const TYPES_NO_STATE = [
  { label: "Off Road Caravans", href: "/listings/off-road-category/" },
  { label: "Luxury Caravans",   href: "/listings/luxury-category/" },
  { label: "Hybrid Caravans",   href: "/listings/hybrid-category/" },
  { label: "Pop Top Caravans",  href: "/listings/pop-top-category/" },
  { label: "Touring Caravans",  href: "/listings/touring-category/" },
  { label: "Family Caravans",   href: "/listings/family-category/" },
];

const FILTERS_NO_STATE = [
  {
    icon: "/images/Budget.png", title: "By Budget",
    links: [
      { text: "Under $30,000",      href: "/listings/under-30000/" },
      { text: "$30,000 – $40,000",  href: "/listings/between-30000-40000/" },
      { text: "$40,000 – $50,000",  href: "/listings/between-40000-50000/" },
      { text: "$50,000 – $70,000",  href: "/listings/between-50000-70000/" },
      { text: "$70,000 – $80,000",  href: "/listings/between-70000-80000/" },
      { text: "$80,000 – $100,000", href: "/listings/between-80000-100000/" },
      { text: "Over $100,000",      href: "/listings/over-100000/" },
    ],
  },
  {
    icon: "/images/ATM.png", title: "By Weight (ATM)",
    links: [
      { text: "Under 1500kg", href: "/listings/under-1500-kg-atm/" },
      { text: "Under 2000kg", href: "/listings/under-2000-kg-atm/" },
      { text: "Under 2500kg", href: "/listings/under-2500-kg-atm/" },
      { text: "Under 3000kg", href: "/listings/under-3000-kg-atm/" },
      { text: "Over 3000kg",  href: "/listings/over-3000-kg-atm/" },
    ],
  },
  {
    icon: "/images/Length.png", title: "By Size (Length)",
    links: [
      { text: "Under 16ft",  href: "/listings/under-16-length-in-feet/" },
      { text: "16ft – 18ft", href: "/listings/between-16-18-length-in-feet/" },
      { text: "18ft – 20ft", href: "/listings/between-18-20-length-in-feet/" },
      { text: "20ft – 22ft", href: "/listings/between-20-22-length-in-feet/" },
      { text: "Over 22ft",   href: "/listings/over-22-length-in-feet/" },
    ],
  },
  {
    icon: "/images/Sleeping.png", title: "By Sleeping Capacity",
    links: [
      { text: "2 Berth",  href: "/listings/2-people-sleeping-capacity/" },
      { text: "3 Berth",  href: "/listings/3-people-sleeping-capacity/" },
      { text: "4 Berth",  href: "/listings/4-people-sleeping-capacity/" },
      { text: "5 Berth",  href: "/listings/5-people-sleeping-capacity/" },
      { text: "6+ Berth", href: "/listings/over-6-people-sleeping-capacity/" },
    ],
  },
];

function buildRegions(state: string) {
  const stateSlug = state.trim().toLowerCase().replace(/ /g, "-");
  return getRegionsByState(stateSlug).map((r) => ({
    name: r.label,
    href: `/listings/${r.state.slug}-state/${r.pageSlug}-region/`,
  }));
}

function buildTypes(state: string) {
  return [
    { label: "Off Road Caravans", href: `/listings/off-road-category/?state=${state}` },
    { label: "Luxury Caravans",   href: `/listings/luxury-category/?state=${state}` },
    { label: "Hybrid Caravans",   href: `/listings/hybrid-category/?state=${state}` },
    { label: "Pop Top Caravans",  href: `/listings/pop-top-category/?state=${state}` },
    { label: "Touring Caravans",  href: `/listings/touring-category/?state=${state}` },
    { label: "Family Caravans",   href: `/listings/family-category/?state=${state}` },
  ];
}

function buildFilters(state: string) {
  return [
    {
      icon: "/images/Budget.png", title: "By Budget",
      links: [
        { text: "Under $50k",  href: `/listings/?max_price=50000&state=${state}` },
        { text: "Under $75k",  href: `/listings/?max_price=75000&state=${state}` },
        { text: "Under $100k", href: `/listings/?max_price=100000&state=${state}` },
        { text: "Over $100k",  href: `/listings/?min_price=100000&state=${state}` },
      ],
    },
    {
      icon: "/images/ATM.png", title: "By Weight (ATM)",
      links: [
        { text: "Under 2000kg",    href: `/listings/?max_atm=2000&state=${state}` },
        { text: "2000kg – 2500kg", href: `/listings/?min_atm=2000&max_atm=2500&state=${state}` },
        { text: "2500kg – 3000kg", href: `/listings/?min_atm=2500&max_atm=3000&state=${state}` },
        { text: "Over 3000kg",     href: `/listings/?min_atm=3000&state=${state}` },
      ],
    },
    {
      icon: "/images/Length.png", title: "By Size (Length)",
      links: [
        { text: "Under 18ft",  href: `/listings/?max_length=18&state=${state}` },
        { text: "18ft – 20ft", href: `/listings/?min_length=18&max_length=20&state=${state}` },
        { text: "20ft – 22ft", href: `/listings/?min_length=20&max_length=22&state=${state}` },
        { text: "Over 22ft",   href: `/listings/?min_length=22&state=${state}` },
      ],
    },
    {
      icon: "/images/Sleeping.png", title: "By Sleeping Capacity",
      links: [
        { text: "2 Berth",           href: `/listings/2-berth-caravans/?state=${state}` },
        { text: "3 – 4 Berth",       href: `/listings/3-4-berth-caravans/?state=${state}` },
        { text: "5 – 6 Berth",       href: `/listings/5-6-berth-caravans/?state=${state}` },
        { text: "Family (7+ Berth)", href: `/listings/7-plus-berth-caravans/?state=${state}` },
      ],
    },
  ];
}

interface Props {
  state?: string;
}

export default function StateBrowseSection({ state }: Props) {
  const hasState = !!state;
  const regions = hasState ? buildRegions(state!) : STATES;
  const types = hasState ? buildTypes(state!) : TYPES_NO_STATE;
  const filters = hasState ? buildFilters(state!) : FILTERS_NO_STATE;

  return (
    <section className="lsd-browse">
      <div className="container">

        {/* Row 1 — Region/State + Type */}
        <div className="lsd-browse__row1">
          <div className="lsd-browse__panel">
            <h3 className="lsd-browse__panel-title">{hasState ? "Browse by Region" : "Browse by State"}</h3>
            <div className="lsd-browse__pills">
              {regions.map((r) => (
                <a key={r.name} href={r.href} className="lsd-browse__pill">{r.name}</a>
              ))}
            </div>

          </div>

          <div className="lsd-browse__divider-v" />

          <div className="lsd-browse__panel">
            <h3 className="lsd-browse__panel-title">Browse by Type</h3>
            <div className="lsd-browse__type-grid">
              {types.map((t) => (
                <a key={t.label} href={t.href} className="lsd-browse__type-card">{t.label}</a>
              ))}
            </div>

          </div>
        </div>

        {/* Row 2 — 4 Filter columns */}
        <div className="lsd-browse__row2">
          {filters.map((f) => (
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
