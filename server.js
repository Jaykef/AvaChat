const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const app = express();
require('dotenv').config();

app.use(express.json());
const PORT = process.env.PORT || 8000;

// Enable CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://localhost:8000/");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
// console.log(REPLICATE_API_TOKEN)


// // Helper function to send POST requests using https
// function sendPostRequest(url, data, headers) {
//   return new Promise((resolve, reject) => {
//     const jsonData = JSON.stringify(data);

//     const options = {
//       method: 'POST',
//       headers: headers || {
//         'Content-Type': 'application/json',
//         'Authorization': `Token ${REPLICATE_API_TOKEN}`,
//       },
//     };

//     const req = https.request(url, options, (res) => {
//       let responseData = '';

//       res.on('data', (chunk) => {
//         responseData += chunk;
//       });

//       res.on('end', () => {
//         const parsedData = JSON.parse(responseData);
//         resolve(parsedData);
//       });
//     });

//     req.on('error', (error) => {
//       reject(error);
//     });

//     req.write(jsonData);
//     req.end();
//   });
// }

// // Helper function to send GET requests using fetch
// function sendMessageRequest(url, headers) {
//   return fetch(url, {
//     method: 'POST',
//     headers: headers || {
//       'Authorization': `Token ${REPLICATE_API_TOKEN}`,
//       'Content-Type': 'application/json',
//     },
//   }).then((response) => response.json());
// }

// // Route to register for an ID
// app.post('/register', async (req, res) => {
//   try {
//     const response = await sendPostRequest('https://api.replicate.com/v1/predictions', req.body);
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to register.' });
//   }
// });

// // Route to send a message using the given ID
// app.post('/sendMessage/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const response = await sendMessageRequest(`https://api.replicate.com/v1/predictions/${id}`);
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to send the message.' });
//   }
// });

//Configure SSL options
const sslOptions = {
  // rejectUnauthorized: false,
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  ciphers: [
      "ECDHE-RSA-AES128-SHA256",
      "DHE-RSA-AES128-SHA256",
      "AES128-GCM-SHA256",
      "RC4",
      "HIGH",
      "!MD5",
      "!aNULL"
  ].join(':'),
};

app.use(express.static(path.join(__dirname, 'app')));

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Server running on port  https://localhost:${PORT}`);
});
