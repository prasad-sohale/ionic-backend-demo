'use strict';

require("dotenv").config();
const http = require("http");
const app = require("./app");

const port = process.env.API_PORT || 4001;

// server listening 
http.createServer(app).listen(port, () => {
  console.log(`Server running on port ${port}.`);
});