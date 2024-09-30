const express = require('express');
const routes = express.Router();

const LearningTrailController = require('./controllers/LearningTrailController');
const LoginController = require('./controllers/LoginController');

routes.get('/learning-trails', LearningTrailController.getAll);
routes.get('/learning-trails/:id', LearningTrailController.getById);
routes.post('/learning-trails', LearningTrailController.save);
routes.put('/learning-trails/:id', LearningTrailController.update);
routes.delete('/learning-trails/:id', LearningTrailController.delete);

routes.post('/login', LoginController.login);

module.exports = routes;
