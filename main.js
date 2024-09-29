const express = require('express');
const mongoose = require('mongoose');
const requireDir = require('require-dir');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

const uri = 'mongodb://127.0.0.1:27017';
mongoose.connect(uri);

requireDir('./models');

app.use('/api', require('./routes.js'));

const apiPort = 3000;
app.listen(apiPort, () => console.log(`Listening on port ${apiPort}`));