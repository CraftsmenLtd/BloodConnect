async function getNearbyLocations(lat, lon, radius = 1000) {
  try {
      const query = `
      [out:json];
      (
          node["amenity"="hospital"](around:${radius}, ${lat}, ${lon});
          relation["amenity"="hospital"](around:${radius}, ${lat}, ${lon});
          node["amenity"~"hospital|clinic|health"](around:${radius}, ${lat}, ${lon});
          relation["amenity"~"hospital|clinic|health"](around:${radius}, ${lat}, ${lon});
      );
      out body;
      >;
      out skel qt;
      `;

      // URL-encode the query
      const urlEncodedQuery = new URLSearchParams({ data: query }).toString();

      console.log("Encoded Query:", urlEncodedQuery); // Debugging line

      const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded', // Ensure the header matches Postman's setting
          },
          body: urlEncodedQuery, // Use the URL-encoded string as the body
      });

      // Check if the response is ok (status in the range 200-299)
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json(); // Parse the JSON response
      return data.elements; // Return the list of nearby locations (amenities)
  } catch (error) {
      console.error(error); // Log the error to understand the failure
      throw new Error(`Failed to fetch nearby locations: ${error.message}`);
  }
}

// Testing the function
getNearbyLocations('37.7749', '-122.4194', 1000)
  .then(amenities => {
      console.log('Nearby locations:', amenities);
  })
  .catch(error => {
      console.error(error);
  });
