async function getNearbyLocations(lat, lon, radius = 1000) {
  try {
      const query = {
        seekerId: 'lkjhasdfka-qrwerie-sfsdl6usdf',
        patientName: 'John Doe',
        neededBloodGroup: 'O-',
        bloodQuantity: 2,
        urgencyLevel: 'urgent',
        location: 'Baridhara, Dhaka',
        latitude: 23.7936,
        longitude: 90.4043,
        donationDateTime: '2024-10-20T15:00:00Z',
        contactInfo: {
          name: 'Jane Doe',
          phone: '+880123456789'
        },
        patientCondition: 'Stable',
        transportationInfo: 'Car available',
        shortDescription: 'Need blood urgently for surgery.'
      }

      // URL-encode the query
      const urlEncodedQuery = new URLSearchParams({ data: query }).toString();

      console.log("Encoded Query:", urlEncodedQuery); // Debugging line

      const response = await fetch('https://x46wvbqe8k.execute-api.ap-south-1.amazonaws.com/api/donations', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json', // Ensure the header matches Postman's setting
          },
          body: JSON.stringify(query), // Use the URL-encoded string as the body
      });
      console.log(response)
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
