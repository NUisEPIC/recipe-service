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

// get request handler for keyword search and filtering via drop downs
app.get('/recipes/search', (req, res) => {
    let allergies = req.body.allergies;
    let diet = req.body.diet;
    let keywords = req.body.data;
    keywords = keywords.map(x => {
        return `'${x}'`;
    });
    let query = `
        SELECT *
        FROM recipes
        WHERE id IN
            (SELECT recipe_id
            FROM ingredients_recipes
            INNER JOIN ingredients ON ingredients.id = ingredients_recipes.ingredient_id
            WHERE ingredients.ingredient IN (${keywords}));
    `;
    console.log(query);
    db.any(query)
    .then(data => {
        res.status(200).json({
            status: 'success',
            data: processRecipes(data),
            message: 'Retrieved messages matching search words'
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send(err);
    });
});

app.get('/recipes/:id', (req, res) => {
    let query = `SELECT * FROM recipes WHERE id = ${req.params.id};`;
    db.any(query)
    .then(data => {
        res.status(200).json({
            status: 200,
            data: processRecipes(data),
            message: `Retrieved recipe id: ${req.params.id}`
        })
    })
    .catch(err => {
        console.error(err);
        res.status(500).send(err);
    });
});

app.get('/recipes', (req, res) => {
    db.any('SELECT * FROM recipes;')
    .then(data => {
        res.status(200).json({
            status: 200,
            data: processRecipes(data),
            message: 'Retrieved ALL recipes.'
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send(err);
    });
});

// Shim because the current PSQL schema is weird and I don't want to fix it.
// TODO: Change the schema to use arrays instead of strings duh
function processRecipes(recipes) {
    return recipes.map(recipe => {
        recipe.machine_title = recipe.meal_title.trim().split(' ').join('_');
        recipe.ingredients = recipe.ingredients.split(', ');
        recipe.instructions = split(recipe.instructions);
        return recipe;
    });
}

function split(list) {
    if (list == null) return null;
    return list.substring(3).split(/, [0-9]\./);
}

app.listen(process.env.PORT || 8888);
console.log(`Listening to port: ${process.env.PORT || 8888}...`);
