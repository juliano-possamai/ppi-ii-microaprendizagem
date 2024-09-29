const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.sendStatus(401);
	}

	const token = authHeader.split(' ')[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
		if (error) {
			return res.sendStatus(403);
		}

		req.user = user;
		return next();
	});
};
module.exports = authenticateJWT;