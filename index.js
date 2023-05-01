const express = require('express');

const app = express();

const session = require('express-session');

const port = process.env.PORT || 3020;

node_session_secret = '6178bfa8-f72a-4328-9392-d2da7bab8637';

app.use(session({
    secret: node_session_secret,
    resave: true,
    saveUninitialized: false
}));

var numPageHits = 0;

app.get('/', (req, res) => {
    if (req.session.numPageHits == null) {
        req.session.numPageHits = 0;
    } else {
        req.session.numPageHits++;
    }
    // req.session.numPageHits = ;
    res.send("You have vsited this page " + req.session.numPageHits + " times");
    // numPageHits++;
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});