import { parseTimeline, extractPoint } from './parse';

describe('parseTimeline', () => {
  it('should correctly parse valid timeline data', () => {
    const data = {
      semanticSegments: [
        {
          startTime: "2023-08-15T10:00:00.000+01:00",
          visit: {
            topCandidate: {
              placeLocation: {
                latLng: "51.4931937°, -0.2363019°",
              },
            },
          },
        },
        {
          startTime: "2023-08-20T12:00:00.000+01:00", // later visit to same point
          visit: {
            topCandidate: {
              placeLocation: {
                latLng: "51.4931937°, -0.2363019°",
              },
            },
          },
        },
        {
          startTime: "2023-06-01T08:30:00.000Z",
          visit: {
            topCandidate: {
              placeLocation: {
                latLng: "48.8809481°, 2.3553137°",
              },
            },
          },
        },
      ],
    };

    const result = parseTimeline(data);
    expect(result).toHaveLength(2);

    const london = result.find(p => p.lat === 51.4932 && p.lng === -0.2363);
    const paris = result.find(p => p.lat === 48.8809 && p.lng === 2.3553);

    expect(london).toMatchObject({
      lat: 51.4932,
      lng: -0.2363,
      year: 2023,
      month: 8,
      visit: 2,
    });

    expect(paris).toMatchObject({
      lat: 48.8809,
      lng: 2.3553,
      year: 2023,
      month: 6,
      visit: 1,
    });
  });

  it('should skip malformed or incomplete entries', () => {
    const data = {
      semanticSegments: [
        {}, // completely empty
        {
          startTime: "2023-05-10T09:00:00.000Z",
          visit: {}, // no topCandidate
        },
        {
          startTime: "2023-05-10T09:00:00.000Z",
          visit: {
            topCandidate: {
              placeLocation: {
                latLng: "not a real coordinate",
              },
            },
          },
        },
      ],
    };

    const result = parseTimeline(data);
    expect(result).toHaveLength(0);
  });
});

describe('extractPoint', () => {
  it('should parse and round valid coordinates', () => {
    const location = {
      startTime: "2023-01-01T00:00:00.000Z",
      visit: {
        topCandidate: {
          placeLocation: {
            latLng: "51.4931937°, -0.2363019°",
          },
        },
      },
    };

    const point = extractPoint(location);
    expect(point).toEqual({
      lat: 51.4932,
      lng: -0.2363,
      date: "2023-01-01",
    });
  });

  it('should return null for invalid input', () => {
    const invalidLocation = {
      startTime: "2023-01-01T00:00:00.000Z",
      visit: {
        topCandidate: {
          placeLocation: {},
        },
      },
    };

    expect(extractPoint(invalidLocation)).toBeNull();
    expect(extractPoint({})).toBeNull();
    expect(extractPoint(null)).toBeNull();
  });
});
