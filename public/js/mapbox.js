/* eslint-disable */

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicHJhZGVlcHNhcmF2YW5hIiwiYSI6ImNremZoeHdkZzByNmgydm55NjEyMzBibTcifQ.8jIXCBbV-6mPz40B4FPckQ';
  const map = new mapboxgl.Map({
    //container here is seto to map what does that mean is that it will put the map with the element id of map
    container: 'map', // container ID
    style: 'mapbox://styles/pradeepsaravana/ckzfk007w005k14o29bnety0h', // style URL
    scrollZoom: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add marker
    new mapboxgl.Marker({
      element: el,
      //bottom of the pin going to located at exact location
      anchor: 'bottom'
      //array of longitudes and latitudes thats what setLngLat accepts so easy
    })
      .setLngLat(loc.coordinates)
      //map is the variable above
      .addTo(map);
    //add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    //extend map bounds to include the current location
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
