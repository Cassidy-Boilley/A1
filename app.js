const express = require('express');
const app = express();
const session = require('express-session');
const usersModel = require('./models/users');
const bcrypt = require('bcrypt');
const Joi = require('joi');
var MongoDBStore = require('connect-mongodb-session')(session);
const dotenv = require('dotenv');
dotenv.config();

app.use(express.urlencoded({ extended: false }));

var dbStore = new MongoDBStore({
  uri: process.env.MONGODB_CONNECTION_STRING,
  collection: 'sessions'
});

app.use(session({
  secret: `${process.env.MONGODB_SESSION_SECRET}`,
  store: dbStore,
  resave: false,
  saveUninitialized: false,
  expires: new Date(Date.now() + 3600000)
}));

// public routes
app.get('/', (req, res) => {
  if (!req.session.GLOBAL_AUTHENTICATED) {
    res.send(`<a href='/login' class='button'> Login </a> <br> <a href='/signup' class='button'> Signup </a>`);
  } else {
    res.send(`
    <h1> Welcome ${req.session.username} </h1>
    <br>
    <a href='/members' class='button'> Go to members area </a>
    <a href='/logout' class='button'> Logout </a>
  `)
  
  }
});

app.get('/login', (req, res) => {
  res.send(`
    <form action="/login" method="post">
      <input type="text" name="email" placeholder="Enter your Email" />
      <input type="password" name="password" placeholder="Enter your password" />
      <input type="submit" value="Login" />
    </form>
  `)

});

app.get('/signup', (req, res) => {
  res.send(`
    <form action="/signup" method="post">
      <input type="text" name="name" placeholder="Enter your username" />
      <input type="text" name="email" placeholder="Enter your email" />
      <input type="text" name="password" placeholder="Enter your password" />
      <input type="submit" value="Signup" />
    </form>
  `)

});



app.post('/login', async (req, res) => {
  
  // sanitize the input using Joi
  const schema = Joi.object({
    email: Joi.string.email.required(),
    password: Joi.string().max(20).required()
  })

  try {
    console.log("req.body.password " + req.body.password);
    const validation = await schema.validateAsync({ password: req.body.password });
  }
  catch (err) {
    console.log(err);
    res.send(`
      <h1> ${err.details[0].message} </h1>
      <br>
      <a href='/login' class='button'> Try Again </a>
      `)
    return
  }

  try {
    const result = await usersModel.findOne({
      email: req.body.email
    })
    if (result === null) {
      res.send(`
            <h1> Invalid email or password </h1>
            <a href='/login' class='button'> Try again. </a>
            `)
    } else if (bcrypt.compareSync(req.body.password, result?.password)) {

      // set a global variable to true if the user is authenticated
      req.session.GLOBAL_AUTHENTICATED = true;
      req.session.loggedUsername = req.body.name;
      req.session.loggedEmail = req.body.email;
      req.session.loggedPassword = req.body.password;

      var hour = 3600000;
      req.session.cookie.expires = new Date(Date.now() + (hour));
      eq.session.cookie.maxAge = hour;

      res.redirect('/members');

    } else {
      res.send( 
        `<h1> Invalid email or password </h1>
        <a href='/login' class='button'> Try again. </a>
      `)
    }

  } catch (error) {
    console.log(error);
  }

});

app.post('/signup', async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().regex(/^[\w\-\s]+$/).max(20).required(),
            email: Joi.string().email().required(),
            password: Joi.string().max(20).required()
        });
        const validation = await schema.validateAsync({ name: req.body.name, email: req.body.email, password: req.body.password });
    } catch (err) {
        res.send(`
        <h1> ${err.details[0].message} </h1>
        <a href='/signup'class='button'> Try again. </a>
        `)
        return;
    };
    try {
        const result = await usersModel.findOne({
            email: req.body.email
        })
        if (result === null && req.body.name && req.body.email && req.body.password) {
            const newUserPassword = bcrypt.hashSync(req.body.password, 10);
            const newUser = new usersModel({
                name: req.body.name,
                email: req.body.email,
                password: newUserPassword
            });
            console.log('Registered successfully.');
            await newUser.save();
            res.redirect('/login');
        } else {
            res.send(`
            <h1> Email already exists. </h1>
            <a href='/signup' class='button'> Try again. </a>
            `);
        }
    } catch (err) {
        console.log(err);
        res.send('Error signing up');
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

app.use(express.static('public')) 

app.get('/members', (req, res) => {
  if(req.session.GLOBAL_AUTHENTICATED){
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;

    res.send(`
      <h1> Hello ${req.session.username} </h1>
      <br>
      
      const imageName = 00${randomImageNumber}.png
      <h1> Protected Route </h1>
      <br>
      <img src="./public/${imageName}" />
      `)
  } else {
    res.redirect('/');
  }
  
});

app.get('*', (req, res) => {
  res.status(404).send('<h1> 404 Page not found</h1>');
});




module.exports = app;