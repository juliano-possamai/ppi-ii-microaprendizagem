const express = require('express');
const routes = express.Router();
const multer  = require('multer')
const multerStorage = require('./helpers/MulterStorage.js');
const upload = multer({ storage: multerStorage })

const LearningTrailController = require('./controllers/LearningTrailController.js');
const UserController = require('./controllers/UserController.js');
const AuthController = require('./controllers/AuthController.js');

const AuthenticationMiddleware = require('./middlewares/AuthenticationMiddleware.js');

routes.get('/learning-trails', AuthenticationMiddleware, LearningTrailController.getAll);
routes.get('/learning-trails/:id', AuthenticationMiddleware, LearningTrailController.getById);
routes.post('/learning-trails', AuthenticationMiddleware, upload.single('file'), LearningTrailController.save);
routes.patch('/learning-trails/:id/sections/:sectionId', AuthenticationMiddleware, LearningTrailController.updateReadStatus);
routes.delete('/learning-trails/:id', AuthenticationMiddleware, LearningTrailController.delete);

routes.post('/users', UserController.create);

routes.post('/auth/password', AuthController.passwordLogin);

module.exports = routes;
