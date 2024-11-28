const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const morgan = require('morgan');
const AuthService = require('./services/AuthService.js');

require('dotenv').config();

const app = express();

app.use(morgan('tiny'));
app.use(express.json());
app.use(cors());

AuthService.registerStrategies();
app.use(passport.initialize());

const uri = 'mongodb://127.0.0.1:27017';
mongoose.connect(uri);

app.use('/api', require('./routes.js'));

const apiPort = 3000;
const apiServer = app.listen(apiPort, () => console.log(`Listening on port ${apiPort}`));

//gracefully shutdown
process.on('SIGTERM', () => {
	apiServer.close();
	mongoose.connection.close(false);

	//TODO clear files on storage/tmp

	// const fs = require('fs');
	// const path = require('path');

	// const directory = path.join(__dirname, 'storage/tmp');
	// fs.rm(directory, { recursive: true, force: true });

	process.exit(0);
});