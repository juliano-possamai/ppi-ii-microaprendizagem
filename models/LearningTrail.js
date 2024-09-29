const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LearningTrailSchema = new Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

LearningTrailSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

const LearningTrail = mongoose.model('LearningTrail', LearningTrailSchema);
module.exports = LearningTrail;
