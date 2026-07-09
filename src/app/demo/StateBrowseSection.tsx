import Image from "next/image";

function toStateSlug(state: string): string {
  return state.trim().toLowerCase().replace(/ /g, "-");
}

function stateLabel(state: string): string {
  return state
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

// Same curated city list as HomeLocationSection's popular-location section —
// reused both as "Popular Region" pills scoped to a category, and (filtered
// down to one state) as the region list once a state is selected. Darwin is
// skipped — Northern Territory isn't in this site's state registry
// (STATES/regions-data only cover the 6 states above).
const POPULAR_REGION_PATHS = [
  { name: "Adelaide",       path: "south-australia-state/adelaide-region/" },
  { name: "Brisbane",       path: "queensland-state/brisbane-region/" },
  { name: "Gold Coast",     path: "queensland-state/gold-coast-region/" },
  { name: "Melbourne",      path: "victoria-state/melbourne-region/" },
  { name: "Perth",          path: "western-australia-state/perth-region/" },
  { name: "Sydney",         path: "new-south-wales-state/sydney-region/" },
  { name: "Cairns",         path: "queensland-state/cairns-region/" },
  { name: "Canberra",       path: "new-south-wales-state/canberra-region/" },
  { name: "Geelong",        path: "victoria-state/geelong-region/" },
  { name: "Hobart",         path: "tasmania-state/hobart-region/" },
  { name: "Newcastle",      path: "new-south-wales-state/newcastle-region/" },
  { name: "Sunshine Coast", path: "queensland-state/sunshine-coast-region/" },
  { name: "Townsville",     path: "queensland-state/townsville-region/" },
  { name: "Wollongong",     path: "new-south-wales-state/illawarra-region/" },
  { name: "Ballarat",       path: "victoria-state/ballarat-region/" },
];

const CATEGORY_LABELS: Record<string, string> = {
  "off-road": "Off Road",
  luxury: "Luxury",
  hybrid: "Hybrid",
  "pop-top": "Pop Top",
  touring: "Touring",
  family: "Family",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// State pills stay useful on a category page too — just carry the category
// filter along so picking a state narrows within that category.
function buildStatesForCategory(category: string) {
  return STATES.map((s) => ({
    name: s.name,
    href: `/listings/${category}-category${s.href.replace("/listings", "")}`,
  }));
}

function buildPopularRegionsForCategory(category: string) {
  return POPULAR_REGION_PATHS.map((r) => ({
    name: r.name,
    href: `/listings/${category}-category/${r.path}`,
  }));
}

// Once a state is picked, narrow the same popular-region list down to that
// state's own regions (state+region combined in the href) — category first
// if one's active too, matching buildSlugFromFilters' segment order.
function buildPopularRegionsForState(state: string, category?: string) {
  const stateSlug = toStateSlug(state);
  const prefix = category ? `/listings/${category}-category` : "/listings";
  return POPULAR_REGION_PATHS
    .filter((r) => r.path.startsWith(`${stateSlug}-state/`))
    .map((r) => ({ name: r.name, href: `${prefix}/${r.path}` }));
}

// Category pills on a state page carry the state along too — category
// segment first, then state, matching buildSlugFromFilters' segment order.
function buildTypesForState(state: string) {
  const stateSlug = toStateSlug(state);
  return TYPES_NO_STATE.map((t) => ({
    label: t.label,
    href: `${t.href}${stateSlug}-state/`,
  }));
}

// Budget/ATM/length/sleep pills on a state page reuse the no-state slugs,
// just prefixed with the state segment (state before these, per
// buildSlugFromFilters' segment order).
function buildFiltersForState(state: string) {
  const stateSlug = toStateSlug(state);
  return FILTERS_NO_STATE.map((f) => ({
    ...f,
    links: f.links.map((l) => ({
      text: l.text,
      href: `/listings/${stateSlug}-state${l.href.replace("/listings", "")}`,
    })),
  }));
}

interface Props {
  state?: string;
  category?: string;
}

export default function StateBrowseSection({ state, category }: Props) {
  const hasState    = !!state;
  const hasCategory = !!category;

  const regions = hasState
    ? buildPopularRegionsForState(state!, category)
    : hasCategory
      ? buildStatesForCategory(category!)
      : STATES;

  const types   = hasState ? buildTypesForState(state!) : TYPES_NO_STATE;
  const filters = hasState ? buildFiltersForState(state!) : FILTERS_NO_STATE;

  const leftTitle = hasState
    ? hasCategory
      ? `Browse ${categoryLabel(category!)} Caravans by Region in ${stateLabel(state!)}`
      : `Browse Caravans by Region in ${stateLabel(state!)}`
    : hasCategory
      ? `Browse ${categoryLabel(category!)} Caravans by State`
      : "Browse Caravans by State";

  const rightTitle = hasState && hasCategory
    ? `Browse ${categoryLabel(category!)} Caravans by ${stateLabel(state!)}`
    : hasCategory
      ? `Browse ${categoryLabel(category!)} Caravans by Popular Region`
      : "Browse Caravans by Category";

  return (
    <section className="lsd-browse">
      <div className="container">

        {/* Row 1 — Region/State + Type/Popular-region */}
        <div className="lsd-browse__row1">
          <div className="lsd-browse__panel">
            <h3 className="lsd-browse__panel-title">{leftTitle}</h3>
            <div className="lsd-browse__pills">
              {regions.map((r) => (
                <a key={r.name} href={r.href} className="lsd-browse__pill">{r.name}</a>
              ))}
            </div>

          </div>

          {/* Once state AND category are both locked in, there's nothing left
              to switch to on this side — no second panel. */}
          {!(hasState && hasCategory) && (
            <>
              <div className="lsd-browse__divider-v" />

              {hasCategory ? (
                <div className="lsd-browse__panel">
                  <h3 className="lsd-browse__panel-title">{rightTitle}</h3>
                  <div className="lsd-browse__pills">
                    {buildPopularRegionsForCategory(category!).map((r) => (
                      <a key={r.name} href={r.href} className="lsd-browse__pill">{r.name}</a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="lsd-browse__panel">
                  <h3 className="lsd-browse__panel-title">{rightTitle}</h3>
                  <div className="lsd-browse__type-grid">
                    {types.map((t) => (
                      <a key={t.label} href={t.href} className="lsd-browse__type-card">{t.label}</a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Row 2 — 4 Filter columns; not useful once a category is already locked in */}
        {!hasCategory && (
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
        )}

      </div>
    </section>
  );
}
