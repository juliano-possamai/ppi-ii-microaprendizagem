const jwt = require('jsonwebtoken');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const passport = require('passport');

class AuthService {

	registerStrategies = () => {
		passport.use(new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password'
			},
			async (email, password, done) => {
				const user = await User.findOne({ email });

				if (!user || !await bcrypt.compare(password, user.password)) {
					return done({ field: 'username', message: 'Usuário ou senha inválidos' }, false);
				}

				return done(null, user);
			}
		));
	}

	generateJwt = (id, username) => {
		//TODO melhoria: adicionar expiração ao token
		return jwt.sign({ id, username }, process.env.ACCESS_TOKEN_SECRET);
	}

}

module.exports = new AuthService();