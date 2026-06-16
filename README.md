# When Was I Here?

"When Was I Here?" is a privacy-first, client-side web game that turns your Google Maps Timeline history into a geo-guessing game.

Ever wondered how well you remember the places you've visited? Simply export your Google Timeline data, upload it to the app, and test your memory. All data processing and gameplay happen completely locally in your browser—your location history never leaves your device!

## Game Modes

- **Was I Here?**: Can you accurately recognize whether you've actually been to a location shown on Street View?
- **Where Am I?**: A classic GeoGuessr-style challenge using only your past locations. Try to pinpoint exactly where you were.
- **When Was I Here?**: You know where you are, but do you remember *when* you visited? Guess the correct date of your visit.

## Features

- **100% Client-Side**: Your Google Timeline export is parsed and filtered locally.
- **GeoGuessr Export**: Generate a custom map file from your Timeline to play directly on GeoGuessr.

## Local Development

### Installation

1. Clone this repository:
   ```bash
   git clone git@github.com:aelmekeev/when-was-i-here.git
   cd when-was-i-here
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173` (or the port provided by Vite).

## Running Tests

To run the Vitest test suite:
```bash
npm test
```
