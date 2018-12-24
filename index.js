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
      // Add on assumed values. The query string itself can be used directly
      // for the Yelp API.
      query += "&city=New York&state=NY&country=US";
      const params = qs.parse(query);

      // TODO: This is all very brittle. Some records are already being filtered
      // out because of the casing of "NY" and "NEW YORK".
      let lobArgs = ["license_status=Active", "address_state=NY", "address_city=NEW YORK"];
      lobArgs.push("business_name=" + params.name);
      const firstSpace = params.address1.indexOf(' ')
      lobArgs.push("address_building=" + params.address1.slice(0, firstSpace));
      lobArgs.push("address_street_name=" + params.address1.slice(firstSpace + 1));
      https.get(lobApi + '?' + lobArgs.join('&'), options, (resp) => {
        let match = "";
        resp.on("data", (data) => {
          match += data;
        });
        resp.on("end", () => {
          // Guaranteed to be a list.
          match = JSON.parse(match);
          let type = "Leased";
          // Industry has been observed to be "Garage", "Parking Lot", and
          // "Garage and Parking Lot".
          for (let m of match) {
            // TODO: Is there some way to move this into the query?
            if (m.industry &&
                (m.industry.indexOf("Parking") != -1 || m.industry.indexOf("Garage") != -1)) {
              type = "Owned";
              break;
            }
          }

          res.writeHead(200, {"Content-Type": "text/html"});
          res.end(type);
        });
        resp.on("error", (err) => {
          console.log("Error matching business: " + err.message);
        });
      });

      // TODO: Unfortunately, the data here is not useful and it doesn't seem
      // to be available through a different endpoint.
      /*
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
