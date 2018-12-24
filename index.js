const http = require("http");
const https = require("https");
const qs = require("querystring");
const fs = require("fs");
// This is for the NYC Legally Operating Businesses API.
const options = {headers: {"X-App-Token": "YOUR_APP_TOKEN"}};
const lobApi = "https://data.cityofnewyork.us/resource/p2mh-mrfv.json";
// const yelpApi = "https://api.yelp.com/v3/businesses/";

http.createServer((req, res) => {
  if (req.method === "GET") {
    fs.readFile("index.html", (err, data) => {
      if (err) {
        // TODO: This is probably the wrong error to send back.
        res.writeHead(404, {"Content-Type": "text/html"});
        return res.end("404 Not Found");
      }

      res.writeHead(200, {"Content-Type": "text/html"});
      res.write(data);
      res.end();
    });
  } else if (req.method === "POST") {
    let query = "";
    req.on("data", (data) => {
      query += data;
    });
    req.on("end", () => {
      const params = qs.parse(query);

      // Add on assumed values.
      const space = params.address1.indexOf(' ')
      let lobArgs = [
          "license_status='Active'",
          // '%25' is the escaped version of '%'.
          "(upper(industry) LIKE '%25PARKING%25' OR upper(industry) LIKE '%25GARAGE%25')",
          "upper(address_state)='NY'",
          "upper(address_city)='NEW YORK'",
          "upper(business_name)='" + params.name + "'",
          // TODO: This is still brittle. There should be data validation at some point,
          // otherwise this really should not assume anything about the format.
          "address_building='" + params.address1.slice(0, space) + "'",
          "upper(address_street_name)='" + params.address1.slice(space + 1) + "'"];

      // Just check to see whether the result is non-empty. The query is specific enough as-is.
      let filter = "$select=count(industry)&$where=" + lobArgs.join(" AND ");
      https.get(lobApi + '?' + filter, options, (lobRes) => {
        let match = "";
        lobRes.on("data", (data) => {
          match += data;
        });
        lobRes.on("end", () => {
          res.writeHead(200, {"Content-Type": "text/html"});

          // match will be a list with a single item unless there is an error.
          match = JSON.parse(match);
          if (match.error) {
            res.end("Error: " + match.message);
          } else if (match[0].count_industry == 0) {
            res.end("Leased");
          } else {
            res.end("Owned");
          }
        });
        lobRes.on("error", (err) => {
          console.log("Error running filter '" + filter + "': " + err.message);
        });
      });

      // TODO: Unfortunately, the data here is not useful and it doesn't seem
      // to be available through a different endpoint.
      /*
      // Add on assumed values. The query string itself can be used directly
      // for the Yelp API.
      query += "&city=NEW YORK&state=NY&country=US";
      https.get(yelpApi + "matches?" + query, options, (resp) => {
        let match = "";
        resp.on("data", (data) => {
          match += data;
        });
        resp.on("end", () => {
          match = JSON.parse(match);
          if (match.businesses) {
            https.get("https://api.yelp.com/v3/businesses/" + match.businesses[0].id, options, (resp) => {
              let details = "";
              resp.on("data", (data) => {
                details += data;
              });
              resp.on("end", () => {
                details = JSON.parse(details);
                console.log(details);
              });
              resp.on("error", (err) => {
                console.log("Error getting details for business: " + err.message);
              })
            });
          } else if (match.error) {
            console.log("Error matching business: " + match.error.description);
          } else {
            console.log("Unknown error matching business.");
          }
        });
        resp.on("error", (err) => {
          console.log("Error matching business: " + err.message);
        });
      });
      */
    });
  } else {
    res.writeHead(404, {"Content-Type": "text/html"});
    return res.end("404 Not Found");
  }
}).listen(8080);
