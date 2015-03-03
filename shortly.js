var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var bluebird = require('bluebird');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.use(session({
  secret: 'cookie5',
  name: 'cookie name',
  proxy: true,
  resave: false,
  saveUninitialized: false
}));

function restrict(req, res, next){
  if(req.session.user){
    next();
  }else{
    req.session.error = 'Access Denied !!!';
    res.redirect('/login');
  }
}


app.get('/' || '/create',
function(req, res) {
  restrict(req, res, function (req, res) {
    res.render('index');
  });
  //res.render('index');
});

// app.get('/create',
// function(req, res) {
//   res.render('index');
// });

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function(req, res){
  //do thing
});

app.post('/signup', function(req, res){
  console.log("the data: ", req.body); // .body, not .data, because express
  //
  // get data from the request. async
  //
  // check if username exists
  //   if yes, redirect whole post to login
  //   else:
  //     write id, username, and hashed password to database
  //     login with the information

  //var userName = req.body.username;
  // check if user exists
  //   look up req.body.user in the table
  //     go through our config.js file
  //       db.
  //db.fetch().then(userExists = true);

  new User({user_name: req.body.username})
    .fetch()
    .then(function(model) {
      console.log('asdf;alskfj', model);
      if(model) {
        console.log('You already exist  ya dingus');
        res.redirect('/login');
      }else{
        // do stuff
        bcrypt.hash(req.body.password, null, null, function (err, hash) {
          // store id, username, hashed password in database
          // assume bcrypt stores salt for us?
          new User({user_name: req.body.username, password: hash}, {patch: true}).save().then(console.log("YOU MODEL: ", model));
          res.redirect('/login');
          // future work: hard code logging in after this
        });
      }
    });
});

app.get('/signup', function (req, res) {
  res.render('signup');
});

app.get('/links',
function(req, res) {
  restrict(req, res, function (req, res) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
