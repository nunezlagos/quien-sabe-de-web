import { describe, it, expect } from 'vitest';
import { availabilityRangeSchema, availabilityArraySchema } from '../../../src/lib/validators/availability';

describe('availabilityRangeSchema', () => {
  it('accepts valid time range', () => {
    const result = availabilityRangeSchema.safeParse({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects end time before start time', () => {
    const result = availabilityRangeSchema.safeParse({
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '09:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = availabilityRangeSchema.safeParse({
      dayOfWeek: 1,
      startTime: '9:00',
      endTime: '18:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects dayOfWeek out of range', () => {
    const result = availabilityRangeSchema.safeParse({
      dayOfWeek: 7,
      startTime: '09:00',
      endTime: '18:00',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all days of week 0-6', () => {
    for (let d = 0; d <= 6; d++) {
      const result = availabilityRangeSchema.safeParse({ dayOfWeek: d, startTime: '10:00', endTime: '17:00' });
      expect(result.success).toBe(true);
    }
  });
});

describe('availabilityArraySchema', () => {
  it('accepts an array of ranges', () => {
    const result = availabilityArraySchema.safeParse([
      { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects more than 50 slots', () => {
    const slots = Array.from({ length: 51 }, (_, i) => ({
      dayOfWeek: i % 7,
      startTime: '09:00',
      endTime: '18:00',
    }));
    const result = availabilityArraySchema.safeParse(slots);
    expect(result.success).toBe(false);
  });
});
