const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuthService = require('../services/AuthService.js');

class UserController {
	async _validateUser (body) {
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

	async create(req, res) {
		const { username, email, password } = req.body;

		const errors = await this._validateUser(req.body);
		if (errors.length) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors: errors });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const user = await User.create({ username, email, password: hashedPassword });
		return res.status(201).json({ user: { username: user.username }, accessToken: AuthService.generateJwt(user._id, user.username) });
	}
}

module.exports = new UserController();
