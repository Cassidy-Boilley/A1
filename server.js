const mongoose = require('mongoose');
const app = require('./app.js');
const dotenv = require('dotenv')
dotenv.config();

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(`${process.env.MONGODB_CONNECTION_STRING}`);
  console.log("connected to db");
  app.listen(process.env.PORT || 3000, () => {
    console.log('server is running on port 3000');
  });
}
