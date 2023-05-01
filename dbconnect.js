

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;

const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config();

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(`mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/test`);
  // await mongoose.connect('mongodb://127.0.0.1:27017/comp2537w1');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  console.log("connected to db");
  app.listen(process.env.PORT || 3000, () => {
    console.log('server is running on port 3000');
  });
}
