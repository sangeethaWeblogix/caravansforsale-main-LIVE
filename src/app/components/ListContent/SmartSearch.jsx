export default function SmartSearch() {
  return (
    <div className="smart-search">
      
        <div className="quick_search_top">
          <i className="bi bi-search search-icon"></i>
          <input className="cfs-select-input" type="text" placeholder="Try 'caravans with bunks'" />
        </div>

        <div className="popular-searches">
          <h5>Popular searches</h5>
          <ul>
            <li>single axle caravans</li>
            <li>small caravans</li>
            <li>family caravans with bunks shower and toilet</li>
            <li>off road caravans with bunks</li>
            <li>4 bunk caravans</li>
            <li>caravans with 3 bunks</li>
            <li>caravans with 2 bunks</li>
          </ul>
        </div>
      
    </div>
  );
}