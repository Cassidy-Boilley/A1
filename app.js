const express = require('express');
const app = express();
const session = require('express-session');
const usersModel = require('./models/users');
const bcrypt = require('bcrypt');
const Joi = require('joi');
var MongoDBStore = require('connect-mongodb-session')(session);
const dotenv = require('dotenv');
dotenv.config();


var dbStore = new MongoDBStore({
  // uri: 'mongodb://localhost:27017/connect_mongodb_session_test',
  uri: process.env.MONGODB_CONNECTION_STRING,
  collection: 'sessions'
});


// replace the in-memory array session store with a database session store
app.use(session({
  secret: `${process.env.SESSIONS_SECRET}`,
  store: dbStore,
  resave: false,
  saveUninitialized: false,
}));

// public routes
app.get('/', (req, res) => {
  if (!req.isAuthenticated) {
    res.send(`<a href='/login' class='button'> Login </a> <br> <a href='/signup' class='button'> Signup </a>`);
  }
  
  
});


app.get('/login', (req, res) => {
  res.send(`
    <form action="/login" method="post">
      <input type="text" name="username" placeholder="Enter your username" />
      <input type="password" name="password" placeholder="Enter your password" />
      <input type="submit" value="Login" />
    </form>
  `)

});

app.get('/signup', (req, res) => {
  res.send(`
    <form action="/signup" method="post">
      <input type="text" name="username" placeholder="Enter your username" />
      <input type="password" name="password" placeholder="Enter your password" />
      <input type="submit" value="Signup" />
    </form>
  `)

});

// GLOBAL_AUTHENTICATED = false;
app.use(express.urlencoded({ extended: false }))
// built-in middleware function in Express. It parses incoming requests with urlencoded payloads and is based on body-parser.

app.use(express.json()) // built-in middleware function in Express. It parses incoming requests with JSON payloads and is based on body-parser.
app.post('/login', async (req, res) => {
  // set a global variable to true if the user is authenticated

  // sanitize the input using Joi
  const schema = Joi.object({
    password: Joi.string()
  })

  try {
    console.log("req.body.password " + req.body.password);
    const value = await schema.validateAsync({ password: req.body.password });
  }
  catch (err) {
    console.log(err);
    console.log("The password has to be a string");
    return
  }

  try {
    const result = await usersModel.findOne({
      username: req.body.username
    })
    if (bcrypt.compareSync(req.body.password, result?.password)) {
      req.session.GLOBAL_AUTHENTICATED = true;
      req.session.loggedUsername = req.body.username;
      req.session.loggedPassword = req.body.password;
      res.redirect('/');
    } else {
      res.send('wrong password')
    }

  } catch (error) {
    console.log(error);
  }

});


app.get('*', (req, res) => {
  res.status(404).send('<h1> 404 Page not found</h1>');
});



// only for authenticated users
const authenticatedOnly = (req, res, next) => {
  if (!req.session.GLOBAL_AUTHENTICATED) {
    return res.status(401).json({ error: 'not authenticated' });
  }
  next(); // allow the next route to run
};
app.use(authenticatedOnly);

app.use(express.static('public')) // built-in middleware function in Express. It serves static files and is based on serve-static.

app.get('/protectedRoute', (req, res) => {
  // serve one of the three images randomly
  // generate a random number between 1 and 3
  const randomImageNumber = Math.floor(Math.random() * 3) + 1;
  const imageName = `00${randomImageNumber}.png`;
  HTMLResponse = `
    <h1> Protected Route </h1>
    <br>
    <img src="${imageName}" />
    `
  res.send(HTMLResponse);
});




app.get('*', (req, res) => {
  res.status(404).send('<h1> 404 Page not found</h1>');
});




module.exports = app;