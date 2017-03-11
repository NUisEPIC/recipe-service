'use strict';
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const pg = require('pg-promise')();
require('./env.js');

const pgConnectionString = 'postgres://localhost:5432/recipedb'
const db = pg(pgConnectionString);

const app = express();

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	req.method === 'OPTIONS' ? res.sendStatus(200) : next();
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// catch 404 and forward to error handler
//app.use(function(req, res, next) {
//  var err = new Error('Not Found');
//  err.status = 404;
//  next(err);
//});

// error handler
//app.use(function(err, req, res, next) {
//  // set locals, only providing error in development
//  res.locals.message = err.message;
//  res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//  // render the error page
//  res.status(err.status || 500);
//  res.render('error');
//});

// post request handler for filtering via the search bar
app.post('/', function(req,res) {
	//make query to db using data in req.body
	console.log(req.body); //temp
	var allergies = req.body.allergies;
	var diet = req.body.diet;
	var keywords = req.body.data.split(' '); // angelo - stil need to add single quotes around each element ofthe array
	keywords = keywords.join(", ");
	var query = "SELECT * FROM recipes WHERE id IN (SELECT recipe_id FROM ingredients_recipes INNER JOIN ingredients ON ingredients.id = ingredients_recipes.ingredient_id WHERE ingredients.ingredient IN (" + keywords+ "));";
	console.log(query);
	db.any(query)
		.then(function (data) {
			res.status(200)
				.json({
					status: 'success',
					data: req.body,
					message: 'Retrieved messages matching search words'
				});
		})
		.catch(function (err) {
			res.status(500).send(err);
		});
});

// get request handler for getting info specific to one recipe
app.get('/recipe-details/:id', function(req, res) {
	//res.send(req.body); //debugging statement
	//console.log("the /recipe-details/:id handler is being used"); //debugging statement
	db.any('SELECT * FROM recipes;') //temp query, change to get specific recipe id
	.then(function (data) {
		res.status(200)
			.json({
				status:'success',
				data: data,
				message: 'Retrieved recipe id: ' + req.params.id
			})
	.catch(function (err) {
			res.status(500).send(err);
		});
	});
});

app.get('/', (req, res) => { //changed route from '*' to '/'
	db.any('SELECT * FROM recipes;')
		.then(function (data) {
			res.status(200)
				.json({
					status: 'success',
					data: data,
					message: 'Retrieved ALL recipes'
				});
		})
		.catch(function (err) {
			res.status(500).send(err);
		});
});

app.listen(process.env.PORT || 8888);
console.log('Listening to port: ' + process.env.PORT);


