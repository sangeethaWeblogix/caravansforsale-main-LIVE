export default function AllFilters() {
  return (
    <>
    
          <div className="filter-item pt-0">
            <h4>Caravan Type</h4>
            <ul className="category-list">
              <li className="category-item">
                <label className="category-checkbox-row checkbox">
                  <div className="d-flex align-items-center">
                    <input
                      className="checkbox__trigger visuallyhidden"
                      type="checkbox"
                    />
                    <span className="checkbox__symbol">
                      <svg
                        aria-hidden="true"
                        className="icon-checkbox"
                        width="28px"
                        height="28px"
                        viewBox="0 0 28 28"
                        version="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 14l8 7L24 7"></path>
                      </svg>
                    </span>
                    <span className="category-name">Off Road</span>
                  </div>
                  <div>
                    <span className="category-count">(3737)</span>
                  </div>
                </label>
              </li>
              <li className="category-item">
                <label className="category-checkbox-row checkbox">
                  <div className="d-flex align-items-center">
                    <input
                      className="checkbox__trigger visuallyhidden"
                      type="checkbox"
                    />
                    <span className="checkbox__symbol">
                      <svg
                        aria-hidden="true"
                        className="icon-checkbox"
                        width="28px"
                        height="28px"
                        viewBox="0 0 28 28"
                        version="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 14l8 7L24 7"></path>
                      </svg>
                    </span>
                    <span className="category-name">Family</span>
                  </div>
                  <div>
                    <span className="category-count">(1976)</span>
                  </div>
                </label>
              </li>
              <li className="category-item">
                <label className="category-checkbox-row checkbox">
                  <div className="d-flex align-items-center">
                    <input
                      className="checkbox__trigger visuallyhidden"
                      type="checkbox"
                    />
                    <span className="checkbox__symbol">
                      <svg
                        aria-hidden="true"
                        className="icon-checkbox"
                        width="28px"
                        height="28px"
                        viewBox="0 0 28 28"
                        version="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 14l8 7L24 7"></path>
                      </svg>
                    </span>
                    <span className="category-name">Touring</span>
                  </div>
                  <div>
                    <span className="category-count">(1921)</span>
                  </div>
                </label>
              </li>
              <li className="category-item">
                <label className="category-checkbox-row checkbox">
                  <div className="d-flex align-items-center">
                    <input
                      className="checkbox__trigger visuallyhidden"
                      type="checkbox"
                    />
                    <span className="checkbox__symbol">
                      <svg
                        aria-hidden="true"
                        className="icon-checkbox"
                        width="28px"
                        height="28px"
                        viewBox="0 0 28 28"
                        version="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 14l8 7L24 7"></path>
                      </svg>
                    </span>
                    <span className="category-name">Luxury</span>
                  </div>
                  <div>
                    <span className="category-count">(1442)</span>
                  </div>
                </label>
              </li>
              <li className="category-item">
                <label className="category-checkbox-row checkbox">
                  <div className="d-flex align-items-center">
                    <input
                      className="checkbox__trigger visuallyhidden"
                      type="checkbox"
                    />
                    <span className="checkbox__symbol">
                      <svg
                        aria-hidden="true"
                        className="icon-checkbox"
                        width="28px"
                        height="28px"
                        viewBox="0 0 28 28"
                        version="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 14l8 7L24 7"></path>
                      </svg>
                    </span>
                    <span className="category-name">Pop Top</span>
                  </div>
                  <div>
                    <span className="category-count">(1055)</span>
                  </div>
                </label>
              </li>
              <li className="category-item">
                <label className="category-checkbox-row checkbox">
                  <div className="d-flex align-items-center">
                    <input
                      className="checkbox__trigger visuallyhidden"
                      type="checkbox"
                    />
                    <span className="checkbox__symbol">
                      <svg
                        aria-hidden="true"
                        className="icon-checkbox"
                        width="28px"
                        height="28px"
                        viewBox="0 0 28 28"
                        version="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 14l8 7L24 7"></path>
                      </svg>
                    </span>
                    <span className="category-name">Hybrid</span>
                  </div>
                  <div>
                    <span className="category-count">(648)</span>
                  </div>
                </label>
              </li>
            </ul>
          </div>
          <div className="filter-item">
            <h4>Location</h4>
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>State</label>
                    <select className="cfs-select-input form-select">
                      <option>Any</option>
                      <option>Australian Capital Territory</option>
                      <option>New South Wales</option>
                      <option>Northern Territory</option>
                      <option>Queensland</option>
                      <option>South Australia</option>
                      <option>Tasmania</option>
                      <option>Victoria</option>
                      <option>Victoria</option>
                      <option>Western Australia</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Region</label>
                    <select className="cfs-select-input form-select" disabled>
                      <option>Any</option>
                      <option>Melbourne</option>
                      <option>Brisbane</option>
                      <option>Adelaide</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="filter-item search-filter">
            <h4>Suburb/Postcode</h4>
            <div className="search-box">
              <div className="secrch_icon">
                <i className="bi bi-search search-icon"></i>
                <input
                  className="filter-dropdown cfs-select-input"
                  placeholder="Search suburb, postcode, state, region"
                  autocomplete="off"
                  type="text"
                  value=""
                />
              </div>
            </div>
          </div>
          <div className="filter-item">
            <h4>Make & Model</h4>
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Make</label>
                    <select className="cfs-select-input form-select">
                      <option>Any</option>
                      <option>JB</option>
                      <option>Lotus</option>
                      <option>New Age</option>
                      <option>Snowy River</option>
                      <option>Titanium</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Model</label>
                    <select className="cfs-select-input form-select" disabled>
                      <option>Any</option>
                      <option>JB Model 1</option>
                      <option>JB Model 2</option>
                      <option>JB Model 3</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="filter-item">
            <h4>ATM</h4>
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="600">600 kg</option>
                      <option value="800">800 kg</option>
                      <option value="1000">1000 kg</option>
                      <option value="1250">1250 kg</option>
                      <option value="1500">1500 kg</option>
                      <option value="1750">1750 kg</option>
                      <option value="2000">2000 kg</option>
                      <option value="2250">2250 kg</option>
                      <option value="2500">2500 kg</option>
                      <option value="2750">2750 kg</option>
                      <option value="3000">3000 kg</option>
                      <option value="3500">3500 kg</option>
                      <option value="4000">4000 kg</option>
                      <option value="4500">4500 kg</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="600">600 kg</option>
                      <option value="800">800 kg</option>
                      <option value="1000">1000 kg</option>
                      <option value="1250">1250 kg</option>
                      <option value="1500">1500 kg</option>
                      <option value="1750">1750 kg</option>
                      <option value="2000">2000 kg</option>
                      <option value="2250">2250 kg</option>
                      <option value="2500">2500 kg</option>
                      <option value="2750">2750 kg</option>
                      <option value="3000">3000 kg</option>
                      <option value="3500">3500 kg</option>
                      <option value="4000">4000 kg</option>
                      <option value="4500">4500 kg</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="filter-item">
            <h4>Price</h4>
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="10000">$10,000</option>
                      <option value="20000">$20,000</option>
                      <option value="30000">$30,000</option>
                      <option value="40000">$40,000</option>
                      <option value="50000">$50,000</option>
                      <option value="60000">$60,000</option>
                      <option value="70000">$70,000</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="10000">$10,000</option>
                      <option value="20000">$20,000</option>
                      <option value="30000">$30,000</option>
                      <option value="40000">$40,000</option>
                      <option value="50000">$50,000</option>
                      <option value="60000">$60,000</option>
                      <option value="70000">$70,000</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="filter-item condition-field">
            <h4>Condition</h4>
            <ul className="category-list">
              <li className="category-item">
                <label className="category-checkbox-row checkbox">
                  <div className="d-flex align-items-center">
                    <input
                      className="checkbox__trigger visuallyhidden"
                      type="checkbox"
                    />
                    <span className="checkbox__symbol">
                      <svg
                        aria-hidden="true"
                        className="icon-checkbox"
                        width="28px"
                        height="28px"
                        viewBox="0 0 28 28"
                        version="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 14l8 7L24 7"></path>
                      </svg>
                    </span>
                    <span className="category-name">New</span>
                  </div>
                </label>
              </li>
              <li className="category-item">
                <label className="category-checkbox-row checkbox">
                  <div className="d-flex align-items-center">
                    <input
                      className="checkbox__trigger visuallyhidden"
                      type="checkbox"
                    />
                    <span className="checkbox__symbol">
                      <svg
                        aria-hidden="true"
                        className="icon-checkbox"
                        width="28px"
                        height="28px"
                        viewBox="0 0 28 28"
                        version="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 14l8 7L24 7"></path>
                      </svg>
                    </span>
                    <span className="category-name">Used</span>
                  </div>
                </label>
              </li>
            </ul>
          </div>
          <div className="filter-item">
            <h4>Sleep</h4>
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="filter-item">
            <h4>Year</h4>
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>From</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                      <option value="2019">2019</option>
                      <option value="2018">2018</option>
                      <option value="2017">2017</option>
                      <option value="2016">2016</option>
                      <option value="2015">2015</option>
                      <option value="2014">2014</option>
                      <option value="2013">2013</option>
                      <option value="2012">2012</option>
                      <option value="2011">2011</option>
                      <option value="2010">2010</option>
                      <option value="2009">2009</option>
                      <option value="2008">2008</option>
                      <option value="2007">2007</option>
                      <option value="2006">2006</option>
                      <option value="2005">2005</option>
                      <option value="2004">2004</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>To</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                      <option value="2019">2019</option>
                      <option value="2018">2018</option>
                      <option value="2017">2017</option>
                      <option value="2016">2016</option>
                      <option value="2015">2015</option>
                      <option value="2014">2014</option>
                      <option value="2013">2013</option>
                      <option value="2012">2012</option>
                      <option value="2011">2011</option>
                      <option value="2010">2010</option>
                      <option value="2009">2009</option>
                      <option value="2008">2008</option>
                      <option value="2007">2007</option>
                      <option value="2006">2006</option>
                      <option value="2005">2005</option>
                      <option value="2004">2004</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="filter-item">
            <h4>Length</h4>
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Any</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="12">12 ft</option>
                      <option value="13">13 ft</option>
                      <option value="14">14 ft</option>
                      <option value="15">15 ft</option>
                      <option value="16">16 ft</option>
                      <option value="17">17 ft</option>
                      <option value="18">18 ft</option>
                      <option value="19">19 ft</option>
                      <option value="20">20 ft</option>
                      <option value="21">21 ft</option>
                      <option value="22">22 ft</option>
                      <option value="23">23 ft</option>
                      <option value="24">24 ft</option>
                      <option value="25">25 ft</option>
                      <option value="26">26 ft</option>
                      <option value="27">27 ft</option>
                      <option value="28">28 ft</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Any</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="12">12 ft</option>
                      <option value="13">13 ft</option>
                      <option value="14">14 ft</option>
                      <option value="15">15 ft</option>
                      <option value="16">16 ft</option>
                      <option value="17">17 ft</option>
                      <option value="18">18 ft</option>
                      <option value="19">19 ft</option>
                      <option value="20">20 ft</option>
                      <option value="21">21 ft</option>
                      <option value="22">22 ft</option>
                      <option value="23">23 ft</option>
                      <option value="24">24 ft</option>
                      <option value="25">25 ft</option>
                      <option value="26">26 ft</option>
                      <option value="27">27 ft</option>
                      <option value="28">28 ft</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </>
  );
}