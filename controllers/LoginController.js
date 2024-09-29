const { User } = require('../models');

const jwt = require('jsonwebtoken');

module.exports = {
	async login(req, res) {
		const { username, password } = req.body;

		const user = await User.findOne({ username: username, password: password }).exec();

		if (!user) {
			return res.status(400).json([{ field: 'username', message: 'Usuário ou senha inválidos' }]);
		}

		const accessToken = jwt.sign({ username: user.username}, process.env.ACCESS_TOKEN_SECRET);
		return res.status(200).json({ user: { username: user.username }, accessToken: accessToken });
	}
};
