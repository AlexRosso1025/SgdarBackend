const express = require('express');

const app = express();
app.get('/pruebas', (req, res) => res.send('pruebas'));


app.use(require('./administracion'));
app.use(require('./categoria'));
app.use(require('./autenticacion'));
app.use(require('./producto'));
app.use(require('./usuario'));




module.exports = app;