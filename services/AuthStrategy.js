const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const passport = require('passport');

const localStrategy = new LocalStrategy(
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
);

module.exports = {
	register() {
		passport.use(localStrategy);
	}
};