require("./utils.js");

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3000;

const app = express();

const Joi = require("joi");


const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var {database} = include('dbconnect.js');

const userCollection = database.db(mongodb_database).collection('./test/sessions/users');

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/test`,
    
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

app.get('/', (req,res) => {
    res.send(`<a href='/login'>Login</a>
    <a href='/signup'>Signup</a>"`);
});

// Create a new user
app.get('/signup', (req, res) => {
  const html = `
    SIgn Up
    <form action='/signup' method='post'>
    <input name='username' type='text' placeholder='username'>
    <input name='email' type='text' placeholder='email'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
  `;
  res.send(html);
});

app.get('/login', (req,res) => {
    var html = `
    Log In
    <form action='/login' method='post'>
    <input name='username' type='text' placeholder='username'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});

app.get('/members', (req,res) => {
    var html = `
    Log In
    <form action='/login' method='post'>
    <input name='username' type='text' placeholder='username'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});

app.get('/logout', (req,res) => {
    res.session.destroy();
    res.redirect('/');
});


app.post('/signup', async (req,res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    

	const schema = Joi.object(
		{
            username: Joi.string().alphanum().max(20).required(),
            email: Joi.string().email().required(),
			password: Joi.string().max(20).required()
		});
	
	const validationResult = schema.validate({username, password});
	if (validationResult.error != null) {
	   console.log(validationResult.error);
	   res.redirect("/createUser");
	   return;
   }

    var hashedPassword = await bcrypt.hash(password, saltRounds);
	
	await userCollection.insertOne({username: username, email: email ,password: hashedPassword});
	console.log("Inserted user");

    var html = "successfully created user";
    res.send(html);
});

app.post('/login', (req, res) => {
  // set a global variable to true if the user is authenticated
  if (users.find((user) => user.username == req.body.username && user.password == req.body.password)) {
    req.session.GLOBAL_AUTHENTICATED = true;
    req.session.loggedUsername = req.body.username;
    req.session.loggedPassword = req.body.password;
  }
  res.redirect('/');

});




app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 