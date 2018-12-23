var http = require('http');
var fs = require('fs');
var url = require('url');

http.createServer(function(req, res) {
  if (req.method === "GET") {
    fs.readFile("index.html", function(err, data) {
      if (err) {
        res.writeHead(404, {"Content-Type": "text/html"});
        return res.end("404 Not Found");
      }

      res.writeHead(200, {"Content-Type": "text/html"});
      res.write(data);
      res.end();
    });
  } else if (req.method === "POST") {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end("not implemented yet");
  } else {
    res.writeHead(404, {"Content-Type": "text/html"});
    return res.end("404 Not Found");
  }
}).listen(8080);
