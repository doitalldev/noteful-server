require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config.js');
const folderRouter = require('../folders/folderRouter');
const notesRouter = require('../notes/notesRouter');

const app = express();

app.use(morgan());
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/folders', folderRouter);
app.use('/api/notes', notesRouter);

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
