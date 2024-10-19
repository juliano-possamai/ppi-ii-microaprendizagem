const passport = require('passport');
const AuthService = require('../services/AuthService.js');

class AuthController {

	constructor() {
		AuthService.registerStrategies();
	}

	async passwordLogin(req, res) {
		passport.authenticate('local', (err, user) => {
			if (err) {
				return res.status(401).json({ message: 'Houveram erros de validação', errors: [err] });
			}

			return res.status(200).json({ user: { username: user.username }, accessToken: AuthService.generateJwt(user._id, user.username) });
		})(req, res);
	}

}

module.exports = new AuthController();