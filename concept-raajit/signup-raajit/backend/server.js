'use strict';

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[Server] TransitOps Signup API running on http://localhost:${PORT}`);
  console.log(`[Server] Health: http://localhost:${PORT}/health`);
  console.log(`[Server] CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
});
