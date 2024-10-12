const express = require('express');
const routes = express.Router();
const multer  = require('multer')
const multerStorage = require('./helpers/MulterStorage.js');
const upload = multer({ storage: multerStorage })

const LearningTrailController = require('./controllers/LearningTrailController');
const LoginController = require('./controllers/UserController.js');

routes.get('/learning-trails', LearningTrailController.getAll);
routes.get('/learning-trails/:id', LearningTrailController.getById);
routes.post('/learning-trails', upload.single('file'), LearningTrailController.save);
routes.delete('/learning-trails/:id', LearningTrailController.delete);

routes.post('/users/login', LoginController.login);
routes.post('/users', LoginController.create);

module.exports = routes;
