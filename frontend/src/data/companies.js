// Pre-populated freight brokers, shippers & carriers
// source maps to PAYLOAD's load source field
export const COMPANIES = [
  // ── Top Freight Brokers ──────────────────────────────────────────────────────
  { name: "C.H. Robinson",              phone: "1-800-323-7587", type: "Freight Broker",  source: "broker",    website: "https://www.chrobinson.com" },
  { name: "Coyote Logistics",           phone: "1-888-731-1500", type: "Freight Broker",  source: "broker",    website: "https://www.coyotelogistics.com" },
  { name: "Echo Global Logistics",      phone: "1-800-354-7993", type: "Freight Broker",  source: "broker",    website: "https://www.echo.com" },
  { name: "TQL (Total Quality Logistics)", phone: "1-800-580-3101", type: "Freight Broker", source: "broker",  website: "https://www.tql.com" },
  { name: "XPO Logistics",              phone: "1-800-755-2728", type: "Freight Broker",  source: "broker",    website: "https://www.xpo.com" },
  { name: "GlobalTranz",                phone: "1-866-275-1407", type: "Freight Broker",  source: "broker",    website: "https://www.globaltranz.com" },
  { name: "Landstar System",            phone: "1-904-398-9400", type: "Freight Broker",  source: "broker",    website: "https://www.landstar.com" },
  { name: "MoLo Solutions",             phone: "1-312-414-9400", type: "Freight Broker",  source: "broker",    website: "https://www.molosolutions.com" },
  { name: "Transplace",                 phone: "1-877-727-8728", type: "Freight Broker",  source: "broker",    website: "https://www.transplace.com" },
  { name: "Nolan Transportation Group", phone: "1-404-467-3200", type: "Freight Broker",  source: "broker",    website: "https://www.ntgfreight.com" },
  { name: "Mode Transportation",        phone: "1-800-645-0291", type: "Freight Broker",  source: "broker",    website: "https://www.modetransportation.com" },
  { name: "Worldwide Express",          phone: "1-888-868-0216", type: "Freight Broker",  source: "broker",    website: "https://www.wwex.com" },
  { name: "Arrive Logistics",           phone: "1-512-900-3440", type: "Freight Broker",  source: "broker",    website: "https://www.arrivelogistics.com" },
  { name: "RXO (formerly XPO Brokerage)", phone: "1-888-796-6071", type: "Freight Broker",source: "broker",   website: "https://www.rxo.com" },
  { name: "Uber Freight",               phone: "1-855-902-1000", type: "Freight Broker",  source: "broker",    website: "https://www.uberfreight.com" },
  { name: "Convoy",                     phone: "1-855-226-6869", type: "Freight Broker",  source: "broker",    website: "https://www.convoy.com" },
  { name: "Flexport",                   phone: "1-415-231-3000", type: "Freight Broker",  source: "broker",    website: "https://www.flexport.com" },
  { name: "Redwood Logistics",          phone: "1-888-756-7779", type: "Freight Broker",  source: "broker",    website: "https://www.redwoodlogistics.com" },
  { name: "SEKO Logistics",             phone: "1-630-919-4850", type: "Freight Broker",  source: "broker",    website: "https://www.sekologistics.com" },
  { name: "Estes Forwarding",           phone: "1-888-378-3748", type: "Freight Broker",  source: "broker",    website: "https://www.efw.com" },
  { name: "AFN Logistics",              phone: "1-847-407-9500", type: "Freight Broker",  source: "broker",    website: "https://www.afn.com" },
  { name: "3PL Worldwide",              phone: "",               type: "Freight Broker",  source: "broker",    website: "" },
  // ── Load Boards / Platforms ───────────────────────────────────────────────────
  { name: "DAT Freight & Analytics",    phone: "1-800-551-8813", type: "Load Board",      source: "dat",       website: "https://www.dat.com" },
  { name: "Truckstop.com",              phone: "1-888-875-5301", type: "Load Board",      source: "truckstop", website: "https://www.truckstop.com" },
  { name: "123Loadboard",               phone: "1-877-875-5301", type: "Load Board",      source: "truckstop", website: "https://www.123loadboard.com" },
  { name: "Direct Freight",             phone: "1-360-214-6600", type: "Load Board",      source: "truckstop", website: "https://www.directfreight.com" },
  { name: "Amazon Freight",             phone: "1-888-281-3847", type: "Load Board",      source: "other",     website: "https://freight.amazon.com" },
  // ── Major Shippers / Direct ───────────────────────────────────────────────────
  { name: "Amazon",                     phone: "1-888-280-4331", type: "Shipper",         source: "direct",    website: "https://freight.amazon.com" },
  { name: "Walmart",                    phone: "1-479-273-4000", type: "Shipper",         source: "direct",    website: "https://www.walmart.com" },
  { name: "Home Depot",                 phone: "1-800-553-3199", type: "Shipper",         source: "direct",    website: "https://www.homedepot.com" },
  { name: "Lowe's",                     phone: "1-704-758-1000", type: "Shipper",         source: "direct",    website: "https://www.lowes.com" },
  { name: "Target",                     phone: "1-800-440-0680", type: "Shipper",         source: "direct",    website: "https://www.target.com" },
  { name: "Costco",                     phone: "1-425-313-8100", type: "Shipper",         source: "direct",    website: "https://www.costco.com" },
  { name: "Dollar General",             phone: "1-615-855-4000", type: "Shipper",         source: "direct",    website: "https://www.dollargeneral.com" },
  { name: "Dollar Tree",                phone: "1-757-321-5000", type: "Shipper",         source: "direct",    website: "https://www.dollartree.com" },
  { name: "FedEx Freight",              phone: "1-866-393-4585", type: "Carrier/Shipper", source: "direct",    website: "https://www.fedexfreight.com" },
  { name: "UPS Freight",                phone: "1-800-333-7400", type: "Carrier/Shipper", source: "direct",    website: "https://www.ups.com/freight" },
  { name: "Old Dominion Freight",       phone: "1-800-432-6335", type: "LTL Carrier",     source: "direct",    website: "https://www.odfl.com" },
  { name: "XPO",                        phone: "1-866-396-4786", type: "LTL Carrier",     source: "direct",    website: "https://www.xpo.com" },
  { name: "Estes Express",              phone: "1-804-353-1900", type: "LTL Carrier",     source: "direct",    website: "https://www.estes-express.com" },
  { name: "Saia LTL Freight",           phone: "1-800-765-7242", type: "LTL Carrier",     source: "direct",    website: "https://www.saia.com" },
  { name: "R+L Carriers",               phone: "1-800-543-5589", type: "LTL Carrier",     source: "direct",    website: "https://www.rlcarriers.com" },
  // ── Construction / Aggregate / Heavy ─────────────────────────────────────────
  { name: "Martin Marietta",            phone: "1-919-781-4550", type: "Aggregate",       source: "direct",    website: "https://www.martinmarietta.com" },
  { name: "Vulcan Materials",           phone: "1-205-298-3000", type: "Aggregate",       source: "direct",    website: "https://www.vulcanmaterials.com" },
  { name: "CEMEX USA",                  phone: "1-800-992-3639", type: "Concrete/Agg",    source: "direct",    website: "https://www.cemex.com" },
  { name: "Lehigh Hanson",              phone: "1-972-653-5500", type: "Aggregate",       source: "direct",    website: "https://www.lehighhanson.com" },
  { name: "CalPortland",                phone: "1-818-591-5700", type: "Concrete/Agg",    source: "direct",    website: "https://www.calportland.com" },
  { name: "US Concrete",                phone: "1-817-835-4105", type: "Concrete",        source: "direct",    website: "https://www.us-concrete.com" },
  { name: "Oldcastle Infrastructure",   phone: "1-855-653-2278", type: "Construction",    source: "direct",    website: "https://www.oldcastleprecast.com" },
  { name: "CRH Americas Materials",     phone: "1-404-885-7600", type: "Aggregate",       source: "direct",    website: "https://www.crhamericas.com" },
  // ── Salt / Sand / Road Maintenance ───────────────────────────────────────────
  { name: "Cargill Salt",               phone: "1-866-720-2739", type: "Salt/De-Icing",   source: "direct",    website: "https://www.cargill.com/salt" },
  { name: "Morton Salt",                phone: "1-312-807-2000", type: "Salt/De-Icing",   source: "direct",    website: "https://www.mortonsalt.com" },
  { name: "American Rock Salt",         phone: "1-585-749-5680", type: "Salt/De-Icing",   source: "direct",    website: "https://www.americanrocksalt.com" },
  { name: "North American Salt",        phone: "1-913-344-9200", type: "Salt/De-Icing",   source: "direct",    website: "" },
  { name: "APAC (CRH Roads)",           phone: "1-404-885-7600", type: "Asphalt/Paving",  source: "direct",    website: "https://www.apacmidwest.com" },
  { name: "Vulcan Asphalt",             phone: "1-205-298-3000", type: "Asphalt/Paving",  source: "direct",    website: "https://www.vulcanmaterials.com" },
  // ── Aggtrans / AggDirect specific ────────────────────────────────────────────
  { name: "Aggtrans",                   phone: "",               type: "Load Board",      source: "aggtrans",  website: "https://www.aggtrans.com" },
  { name: "AggDirect",                  phone: "",               type: "Load Board",      source: "aggdirect", website: "https://www.aggdirect.com" },
];

export function searchCompanies(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return COMPANIES
    .filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
    .slice(0, 10);
}
