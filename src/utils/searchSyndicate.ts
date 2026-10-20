import { Property } from '../types';

/**
 * Strictly real-life data mode: no synthetic or mock syndicated properties.
 * All search queries operate exclusively on real properties stored in the live database.
 */
export const SYNDICATED_GLOBAL_PROPERTIES: Property[] = [];

/**
 * Searches real-life properties from the live database.
 */
export function queryWorldwideProperties(searchQuery: string, localProperties: Property[]): Property[] {
  const query = searchQuery.trim().toLowerCase();
  const realProperties = (localProperties || []).filter(
    (p) => p && !p.id.startsWith('syn-') && p.status !== 'suspended'
  );

  if (!query || query === 'all') {
    return realProperties;
  }

  return realProperties.filter((prop) => {
    const matchesTitle = prop.title.toLowerCase().includes(query);
    const matchesArea = prop.area.toLowerCase().includes(query);
    const matchesCity = prop.city?.toLowerCase().includes(query) || false;
    const matchesCountry = prop.country?.toLowerCase().includes(query) || false;
    const matchesRegion = prop.globalRegion?.toLowerCase().includes(query) || false;
    const matchesAddress = prop.address?.toLowerCase().includes(query) || false;

    const matchesRooms = (prop.rooms || []).some(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.bedConfiguration?.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query)
    );

    return (
      matchesTitle ||
      matchesArea ||
      matchesCity ||
      matchesCountry ||
      matchesRegion ||
      matchesAddress ||
      matchesRooms
    );
  });
}


