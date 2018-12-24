# nyc-parking-lookup

This is a basic application to look up parking data for businesses and business owners in NYC. The data is queried through the Yelp API and the NYC Legally Operating Businesses database.

Check it out at http://nyc-parking-lookup.herokuapp.com/.

## Known Issues

The Yelp Fusion API business details endpoint does not seem to contain the desired parking data. From inspecting the Yelp academic business dataset, the parking data should be in business attributes section, but this does not seem to ever be populated in the query response.
