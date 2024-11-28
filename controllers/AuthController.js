const passport = require('passport');
const AuthService = require('../services/AuthService.js');

class AuthController {

	_validatePasswordLogin(req) {
		const errors = [];

		if (!req.body.email) {
			errors.push({ error: 'Informe o email', field: 'email' });
		}

		if (!req.body.password) {
			errors.push({ error: 'Informe a senha', field: 'password' });
		}

		return errors;
	}

	passwordLogin = async(req, res) => {
		const errors = this._validatePasswordLogin(req);
		if (errors.length) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors });
		}

		passport.authenticate('local', (err, user) => {
			if (err) {
				return res.status(401).json({ message: 'Houveram erros de validação', errors: [err] });
			}

			return res.status(200).json({ user: { username: user.username }, accessToken: AuthService.generateJwt(user._id, user.username) });
		})(req, res);
	}

}

module.exports = new AuthController();