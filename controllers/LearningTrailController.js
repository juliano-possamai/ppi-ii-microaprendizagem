import { Pipeline } from '@xenova/transformers';

function validateData() {
	return [];
}

module.exports = {
	async getAll(req, res) {
		const trails = await LearningTrail.find();
		return res.json(trails);
	},

	async save(req, res) {
		const fs = require('fs');
		const pdf = require('pdf-parse');w

		let dataBuffer = fs.readFileSync('./tmp.pdf');

		pdf(dataBuffer).then(async data => {

			/*
			Obter arquivo da request
			Iterar pelas paginas dos intervalos selecionados pelo usuário

			*/
			const summarization = await pipeline(
				'summarization', // task
				'Xenova/t5-small' // model
			);

			summarization(data.text).then((summary) => {
				console.log(summary);
			});
		});


		const errors = await validateData('', req.body);
		if (errors.length) {
			return res.status(400).json({ errors: errors });
		}

		const trail = await LearningTrail.create(req.body);
		return res.status(201).json(trail);
	},

	async getById(req, res) {
		const trail = await LearningTrail.findById(req.params.id);
		return res.json(trail);
	},

	async update(req, res) {
		const errors = await validateData(req.params.id, req.body);
		if (errors.length) {
			return res.status(400).json({ errors: errors });
		}

		await LearningTrail.findByIdAndUpdate(req.params.id, req.body);
		return res.status(204).send();
	},

	async delete(req, res) {
		await LearningTrail.findByIdAndDelete(req.params.id);
		return res.status(204).send();
	},

};