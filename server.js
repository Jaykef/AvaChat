const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const app = express();
require('dotenv').config();

app.use(express.json());
const PORT = process.env.PORT || 8000;

// Enable CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:8000/");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});


app.use(express.static(path.join(__dirname, 'app')));

http.createServer(app).listen(PORT, () => {
  console.log(`Server running on port  http://localhost:${PORT}`);
});
