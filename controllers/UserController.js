const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const passport = require('passport');
const AuthStrategy = require('../services/AuthStrategy');

AuthStrategy.register();

async function validateUser(body) {
	let errors = [];

	if (!body.username) {
		errors.push({ field: 'username', error: 'Informe o nome de usuário' });
	}

	if (!body.email) {
		errors.push({ field: 'email', error: 'Informe o email' });
	} else if (true) {
		//TODO validar email
	}

	if (!body.password) {
		errors.push({ field: 'password', error: 'Informe a senha' });
	}

	if (!errors.length) {
		const userExists = await User.findOne({ email: body.email });
		if (userExists) {
			errors.push({ field: 'email', error: 'Email já cadastrado' });
		}
	}

	return errors;
}

function generateJwt(id, username) {
	return jwt.sign({ id, username }, process.env.ACCESS_TOKEN_SECRET);
}

module.exports = {
	async login(req, res) {
		passport.authenticate('local', (err, user) => {
			if (err) {
				return res.status(401).json({ message: 'Houveram erros de validação', errors: [err] });
			}

			return res.status(200).json({ user: { username: user.username }, accessToken: generateJwt(user._id, user.username) });
		})(req, res);
	},

	async create(req, res) {
		const { username, email, password } = req.body;

		const errors = await validateUser(req.body);
		if (errors.length) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors: errors });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const user = await User.create({ username, email, password: hashedPassword });
		return res.status(201).json({ user: { username: user.username }, accessToken: generateJwt(user._id, user.username) });
	}
};
