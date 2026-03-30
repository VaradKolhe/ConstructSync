require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Labour service is running on port ${PORT}`);
});

