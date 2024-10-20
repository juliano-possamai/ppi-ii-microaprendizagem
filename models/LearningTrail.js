const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrailSection = new Schema({
	read: {
		type: Boolean,
		default: false
	},
	content: {
		type: String,
		required: true
	}
});

const LearningTrailSchema = new Schema({
	title: {
		type: String,
		required: true,
		trim: true
	},
	sections: [
		{
			type: TrailSection,
			required: true
		}
	],
	userId: {
		type: Schema.Types.ObjectId,
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
