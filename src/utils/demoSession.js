const createdAtDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2); // 2 months ago

export const demoSession = {
  demo: true,
  createdAt: createdAtDate.toISOString(),
  minDate: new Date(2023, 2, 1),
  maxDate: new Date(2025, 4, 1),
  coordinates: [
    { lat: 46.592, lng: 7.907, year: 2022, month: 8, sv: true }, // Switzerland
    { lat: -36.8236, lng: 139.8629, year: 2023, month: 2, sv: true }, // Adelaide
    { lat: 23.147629, lng: 53.731, year: 2024, month: 9, sv: true }, // UAE
    { lat: 51.5069119, lng: -0.075076, year: 2023, month: 12, sv: true }, // London
    { lat: 42.268173, lng: 2.958889, year: 2024, month: 5, sv: true }, // Spain
    { lat: 40.758588, lng: -73.985083, year: 2017, month: 4, sv: true }, // New York
    { lat: 1.280441, lng: 103.862339, year: 2025, month: 4, sv: true }, // Singapore
    { lat: 51.382974, lng: -2.357461, year: 2022, month: 6, sv: true }, // Bath
    { lat: 48.85805, lng: 2.297674, year: 2020, month: 1, sv: true }, // Paris
  ],
};
