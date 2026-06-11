const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let mapsPromise = null;
let svService = null;

export const loadGoogleMaps = () => {
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
    } else {
      if (document.querySelector('script[data-google-maps]')) {
        const waitForReady = () => {
          if (window.google && window.google.maps) resolve();
          else setTimeout(waitForReady, 50);
        };
        waitForReady();
      } else {
        const script = document.createElement('script');
        script.setAttribute('data-google-maps', 'true');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=marker`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      }
    }
  });

  return mapsPromise;
};

export const verifyStreetView = async (lat, lng, radius = 50) => {
  await loadGoogleMaps();
  if (!svService) {
    svService = new window.google.maps.StreetViewService();
  }

  return new Promise((resolve) => {
    svService.getPanorama(
      { location: { lat, lng }, radius, source: window.google.maps.StreetViewSource.OUTDOOR },
      (data, status) => {
        if (status === window.google.maps.StreetViewStatus.OK) {
          resolve({
            hasSV: true,
            lat: data.location.latLng.lat(),
            lng: data.location.latLng.lng()
          });
        } else {
          resolve({ hasSV: false });
        }
      }
    );
  });
};
