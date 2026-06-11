import { getTimelineSummary } from './summary';

describe('getTimelineSummary', () => {
  it('returns 0 for empty input', () => {
    const input = { coordinates: [] };
    const result = getTimelineSummary(input);
    expect(result.pointsEstimate).toBe(0);
  });

  it('returns correct count for distant points', () => {
    const input = {
      coordinates: [
        { lat: 51.5, lng: 0.0, year: 2022, month: 5 },
        { lat: 52.5, lng: 0.0, year: 2023, month: 6 },
        { lat: 53.5, lng: 0.0, year: 2023, month: 7 },
      ],
    };

    const result = getTimelineSummary(input, 50); // 50 meters
    expect(result.pointsEstimate).toBe(3);
  });

  it('groups close points within threshold', () => {
    const input = {
      coordinates: [
        { lat: 51.5000, lng: -0.1200, year: 2023, month: 4 },
        { lat: 51.5003, lng: -0.1203, year: 2023, month: 4 }, // ~39m away
        { lat: 51.5020, lng: -0.1220, year: 2023, month: 4 }, // ~250m away
      ],
    };

    const result = getTimelineSummary(input, 50);
    expect(result.pointsEstimate).toBe(2); // first two grouped, third separate
  });

  it('respects custom grouping distance', () => {
    const input = {
      coordinates: [
        { lat: 40.7128, lng: -74.0060, year: 2021, month: 1 },  // New York
        { lat: 40.7138, lng: -74.0070, year: 2021, month: 2 },  // ~139m away
      ],
    };

    const resultNear = getTimelineSummary(input, 150);
    const resultFar = getTimelineSummary(input, 100);

    expect(resultNear.pointsEstimate).toBe(1); // grouped
    expect(resultFar.pointsEstimate).toBe(2);  // separate
  });
});
