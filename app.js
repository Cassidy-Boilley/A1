const express = require('express');
const app = express();
const session = require('express-session');
const usersModel = require('./models/users');
const bcrypt = require('bcrypt');
const Joi = require('joi');
var MongoDBStore = require('connect-mongodb-session')(session);
const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

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
    res.render('app.ejs', {
      "username": req.session.loggedUsername
    });
  } else {
    res.render('authenticated.ejs', {
      "username": req.session.loggedUsername
    });
  }
  
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs');

});



app.post('/login', async (req, res) => {
  
  // sanitize the input using Joi
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required()
  })

  try {
    console.log("req.body.password " + req.body.password);
    const validation = await schema.validateAsync({ email: req.body.email, password: req.body.password });
  }
  catch (err) {
    console.log(err);
    console.log(req.body.email)
    res.send(`
      <h1> ${err.details[0].message} </h1>
      <br>
      <button><a href='/login' class='button'> Try Again </a></button>
      `)
    return
  }

  try {
    const result = await usersModel.findOne({
      email: req.body.email,
    
    })
    if (result === null) {
      res.send(`
            <h1> Invalid email or password </h1>
            <button><a href='/login' class='button'> Try again. </a></button>
            `)
    } else if (bcrypt.compareSync(req.body.password, result?.password)) {

      // set a global variable to true if the user is authenticated
      req.session.GLOBAL_AUTHENTICATED = true;
      req.session.loggedUsername = result?.name;
      req.session.loggedEmail = req.body.email;
      req.session.loggedPassword = req.body.password;
      req.session.loggedType = result.type;

      var hour = 3600000;
      req.session.cookie.expires = new Date(Date.now() + (hour));
      req.session.cookie.maxAge = hour;

      res.redirect('/members');

    } else {
      res.send( 
        `<h1> Invalid email or password </h1>
        <button><a href='/login' class='button'> Try again. </a></button>
      `)
    }

  } catch (error) {
    console.log(error);
  }

});

app.post('/signup', async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().max(20).required(),
            email: Joi.string().email().required(),
            password: Joi.string().max(20).required()
        });
        const validation = await schema.validateAsync({ name: req.body.name, email: req.body.email, password: req.body.password });
    } catch (err) {
        res.send(`
        <h1> ${err.details[0].message} </h1>
        <button><a href='/signup'class='button'> Try again. </a></button>
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
                password: newUserPassword,
                type: "user"
            });
            console.log('Registered successfully.');
            await newUser.save();
            res.redirect('/login');
        } else {
            res.send(`
            <h1> Email already exists. </h1>
            <br>
            <button><a href='/signup'> Try again. </a></button>
            `);
        }
    } catch (err) {
        console.log(err);
        res.send('Error signing up');
    }
});

app.use(express.static('public')) 

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/admin', async(req, res) => {
  const result = await usersModel.find({});
  if (!req.session.GLOBAL_AUTHENTICATED) {
    res.redirect('/login'); 

  } else if (req.session.loggedType == "admin") {
    res.render('admin.ejs', {
      users: result
    });

  } else {
    res.status(403).send('<h1> You are not authorized</h1>');
  }
 
});

app.get('/members', (req, res) => {
  
  if(req.session.GLOBAL_AUTHENTICATED){
    
    res.render('members.ejs', {
      username: req.session.loggedUsername
    });

  } else {
    res.redirect('/');
  }
  
});

app.post("/admin/promote", async (req, res) => {
  const userId = req.body;
  try {
        const result = await usersModel.updateOne(
            { _id: userId.userId },
            { $set: { type: "admin" } }
    );
        res.redirect("/admin");
    } catch (error) {
        res.send("An error happened, please try again");
    }
});

app.post("/admin/demote", async (req, res) => {
  const userId = req.body;
    try {
        const result = await usersModel.updateOne(
            { _id: userId.userId },
            { $set: { type: "user" } }
        );
        res.redirect("/admin");
    } catch (error) {
        res.send("An error happened, please try again");
    }
});


app.get('*', (req, res) => {
  res.status(404).send('<h1> 404 Page not found</h1>');
});




module.exports = app;