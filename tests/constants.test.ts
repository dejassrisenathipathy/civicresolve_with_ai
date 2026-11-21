import { describe, it, expect } from 'vitest';
import {
  CATEGORY_DEPARTMENT_MAP,
  getDepartmentForCategory,
  COMPLAINT_CATEGORIES,
} from '@/lib/domain/constants';

describe('Category and Department Mapping', () => {
  it('maps all defined categories to departments', () => {
    COMPLAINT_CATEGORIES.forEach((cat) => {
      const dept = CATEGORY_DEPARTMENT_MAP[cat];
      expect(dept).toBeDefined();
      expect(typeof dept).toBe('string');
      expect(dept.length).toBeGreaterThan(0);
    });
  });

  it('maps specific categories to expected municipal departments', () => {
    expect(getDepartmentForCategory('roads_potholes')).toBe('Roads & Public Works');
    expect(getDepartmentForCategory('garbage_sanitation')).toBe('Solid Waste Management');
    expect(getDepartmentForCategory('streetlights_electrical')).toBe('Electrical & Street Lighting');
    expect(getDepartmentForCategory('water_supply_leakage')).toBe('Water Supply Board');
    expect(getDepartmentForCategory('drainage_sewage')).toBe('Drainage & Sewerage');
    expect(getDepartmentForCategory('traffic_signals')).toBe('Traffic Engineering');
    expect(getDepartmentForCategory('parks_public_spaces')).toBe('Parks & Horticulture');
    expect(getDepartmentForCategory('stray_animals')).toBe('Public Health & Veterinary');
    expect(getDepartmentForCategory('public_safety')).toBe('Public Safety Cell');
    expect(getDepartmentForCategory('other')).toBe('General Grievance Cell');
  });

  it('falls back to General Grievance Cell for undefined or unrecognized categories', () => {
    expect(getDepartmentForCategory(null)).toBe('General Grievance Cell');
    expect(getDepartmentForCategory(undefined)).toBe('General Grievance Cell');
    expect(getDepartmentForCategory('unknown_xyz')).toBe('General Grievance Cell');
  });
});
