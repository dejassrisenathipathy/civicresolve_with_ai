/**
 * Civic grievance categories recognized by the platform.
 */
export const COMPLAINT_CATEGORIES = [
  'roads_potholes',
  'garbage_sanitation',
  'streetlights_electrical',
  'water_supply_leakage',
  'drainage_sewage',
  'traffic_signals',
  'parks_public_spaces',
  'stray_animals',
  'public_safety',
  'other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

/**
 * Mapping from complaint categories to responsible municipal departments.
 */
export const CATEGORY_DEPARTMENT_MAP: Record<ComplaintCategory, string> = {
  roads_potholes: 'Roads & Public Works',
  garbage_sanitation: 'Solid Waste Management',
  streetlights_electrical: 'Electrical & Street Lighting',
  water_supply_leakage: 'Water Supply Board',
  drainage_sewage: 'Drainage & Sewerage',
  traffic_signals: 'Traffic Engineering',
  parks_public_spaces: 'Parks & Horticulture',
  stray_animals: 'Public Health & Veterinary',
  public_safety: 'Public Safety Cell',
  other: 'General Grievance Cell',
};

/**
 * Human-readable display labels for user selection menus.
 */
export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  roads_potholes: 'Roads & Potholes',
  garbage_sanitation: 'Garbage & Sanitation',
  streetlights_electrical: 'Streetlights & Electrical',
  water_supply_leakage: 'Water Supply & Leakage',
  drainage_sewage: 'Drainage & Sewage',
  traffic_signals: 'Traffic Signals',
  parks_public_spaces: 'Parks & Public Spaces',
  stray_animals: 'Stray Animals',
  public_safety: 'Public Safety',
  other: 'Other Civic Grievance',
};

/**
 * Retrieves the responsible department for a given complaint category.
 *
 * @param {string | undefined | null} category - The category key.
 * @returns {string} Name of the responsible department.
 */
export function getDepartmentForCategory(category?: string | null): string {
  if (!category || !(category in CATEGORY_DEPARTMENT_MAP)) {
    return 'General Grievance Cell';
  }
  return CATEGORY_DEPARTMENT_MAP[category as ComplaintCategory];
}
