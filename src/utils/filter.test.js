import { filterPoints } from './filter';

describe('filterPoints', () => {
  it('filters out high-visit locations and computes date range', () => {
    const input = [
      { lat: 1, lng: 2, year: 2023, month: 5, visit: 20 },
      { lat: 3, lng: 4, year: 2022, month: 10, visit: 100 }, // should be excluded
      { lat: 5, lng: 6, year: 2021, month: 1, visit: 10 },
    ];

    const { coordinates, minDate, maxDate } = filterPoints(input);

    expect(coordinates).toHaveLength(2);
    expect(coordinates).toEqual([
      { lat: 1, lng: 2, year: 2023, month: 5, svVerified: 'pending', fallbacks: undefined },
      { lat: 5, lng: 6, year: 2021, month: 1, svVerified: 'pending', fallbacks: undefined },
    ]);

    expect(minDate.getFullYear()).toBe(2021);
    expect(minDate.getMonth()).toBe(0); // January

    expect(maxDate.getFullYear()).toBe(2023);
    expect(maxDate.getMonth()).toBe(4); // May
  });

  it('returns empty result if all points are filtered out', () => {
    const input = [
      { lat: 1, lng: 2, year: 2023, month: 5, visit: 999 },
    ];

    const result = filterPoints(input);

    expect(result.coordinates).toEqual([]);
    expect(result.minDate).toBeNull();
    expect(result.maxDate).toBeNull();
  });

  it('returns empty results if input is empty', () => {
    const result = filterPoints([]);

    expect(result.coordinates).toEqual([]);
    expect(result.minDate).toBeNull();
    expect(result.maxDate).toBeNull();
  })
});
