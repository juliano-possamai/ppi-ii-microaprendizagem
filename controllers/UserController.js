const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuthService = require('../services/AuthService.js');
const Validator = require('validator');

class UserController {

	_validateUser = async(body) => {
		let errors = [];

		if (!body.username) {
			errors.push({ field: 'username', error: 'Informe o nome de usuário' });
		} else if (body.username.length < 3) {
			errors.push({ field: 'username', error: 'O nome de usuário deve ter no mínimo 3 caracteres' });
		}

		if (!body.email) {
			errors.push({ field: 'email', error: 'Informe o email' });
		} else if (!Validator.isEmail(body.email)) {
			errors.push({ field: 'email', error: 'O email informado é inválido' });
		}

		if (!body.password) {
			errors.push({ field: 'password', error: 'Informe a senha' });
		}

		if (body.password != body.passwordConfirmation) {
			errors.push({ field: 'passwordConfirmation', error: 'As senhas informadas não conferem' });
		}

		if (!errors.length) {
			const userExists = await User.findOne({ email: body.email });
			if (userExists) {
				errors.push({ field: 'email', error: 'Email já cadastrado' });
			}
		}

		return errors;
	}

	create = async(req, res) => {
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
