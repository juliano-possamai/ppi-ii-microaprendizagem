const fs = require('fs');
const LearningTrail = require('../models/LearningTrail');
const SummarizerService = require('../services/SummarizerService');

class LearningTrailController {

	_validateData = (req) => {
		const errors = [];

		if (!req.body.title) {
			errors.push({ error: 'Informe o título da trilha', field: 'title' });
		} else if (req.body.title.length < 3) {
			errors.push({ error: 'O título deve ter no mínimo 3 caracteres', field: 'title' });
		}

		if (!req.file) {
			errors.push({ error: 'Informe o arquivo a ser resumido', field: 'file' });
		} else if (req.file.mimetype != 'application/pdf') {
			errors.push({ error: 'O arquivo informado deve ser no formato PDF', field: 'file' });
		}

		if (!req.body.pageStart) {
			errors.push({ error: 'Informe a página que marca o início do conteúdo', field: 'contentStart' });
		}

		if (!req.body.pageEnd) {
			errors.push({ error: 'Informe a página que marca o fim do conteúdo', field: 'contentEnd' });
		}

		return errors;
	}

	getAll = async (req, res) => {
		const status = req.query.status;
		const query = { userId: req.user.id };

		if (status) {
			query.status = status;
		}

		const trails = await LearningTrail.find(query);
		return res.json(trails);
	}

	save = async (req, res) => {
		let validationErrors = this._validateData(req);
		if (validationErrors.length) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors: validationErrors });
		}

		const summarizerService = new SummarizerService(req.file.path, req.body.pageStart, req.body.pageEnd);

		const summarizerErrors = await summarizerService.validate();
		if (summarizerErrors.length) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors: summarizerErrors });
		}

		const summarizedSections = await summarizerService.summarize();
		//TODO mover unlink para middleware
		fs.unlink(`${req.file.destination}/${req.file.filename}`, err => { });

		const newTrail = await LearningTrail.create({
			title: req.body.title,
			userId: req.user.id,
			sections: summarizedSections.map(section => {
				return { read: false, content: section.content, name: section.name };
			})
		});

		return res.status(201).json({ id: newTrail._id });
	}

	getById = async (req, res) => {
		const trail = await LearningTrail.findOne({ _id: req.params.id, userId: req.user.id });

		if (!trail) {
			return res.status(404).json({ message: 'Trilha não encontrada' });
		}

		return res.json(trail);
	}

	delete = async (req, res) => {
		const trail = await LearningTrail.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

		if (!trail) {
			return res.status(404).send({ message: 'Trilha não encontrada' });
		}

		return res.status(204).send();
	}

	updateReadStatus = async (req, res) => {
		const trail = await LearningTrail.findOneAndUpdate(
			{ _id: req.params.id, userId: req.user.id, sections: { $elemMatch: { _id: req.params.sectionId } } },
			{ $set: { 'sections.$.read': Boolean(req.body.read) } },
			{ new: true }
		);

		if (!trail) {
			return res.status(404).json({ message: 'Trilha não encontrada' });
		}

		return res.status(204).send();
	}

	updateSections = async (req, res) => {
		const trail = await LearningTrail.findOne({ _id: req.params.id, userId: req.user.id });

		if (!trail) {
			return res.status(404).json({ message: 'Trilha não encontrada' });
		}

		if (!req.body.sections) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors: [{ error: 'Informe as seções da trilha', field: 'sections' }] });
		}

		trail.sections = req.body.sections.map(section => ({
			read: false,
			content: section
		}));

		trail.status = 2;

		await trail.save();
		return res.status(204).send();
	}

}

module.exports = new LearningTrailController();