/**
 * Display-name overrides for station complexes that merge stations with
 * different names. Without these, groupComplexes() picks the first member's
 * name arbitrarily (so the Bleecker St / Broadway-Lafayette complex might
 * show either). Keyed by MTA complex id; names follow common MTA usage.
 *
 * Only the 17 multi-name complexes need an entry; everything else uses its
 * single station name.
 */
export const COMPLEX_NAMES: Record<string, string> = {
  '601': '14 St/6 Av',
  '605': '168 St',
  '606': 'Court Sq',
  '609': '42 St-Bryant Pk/5 Av',
  '611': 'Times Sq-42 St/Port Authority',
  '612': 'Lexington Av/53 St-51 St',
  '613': 'Lexington Av/59 St',
  '615': 'New Utrecht Av/62 St',
  '616': '74 St-Broadway/Jackson Hts-Roosevelt Av',
  '618': '14 St/8 Av',
  '619': 'Broadway-Lafayette St/Bleecker St',
  '620': 'Borough Hall/Court St',
  '622': 'Brooklyn Bridge-City Hall/Chambers St',
  '624': 'WTC-Chambers St/Park Place',
  '626': 'Franklin Av/Botanic Garden',
  '629': 'Metropolitan Av/Lorimer St',
  '635': 'South Ferry/Whitehall St',
}
