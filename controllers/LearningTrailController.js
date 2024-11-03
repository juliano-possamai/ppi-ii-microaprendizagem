const fs = require('fs');
const LearningTrail = require('../models/LearningTrail');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { TokenTextSplitter } = require('langchain/text_splitter');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { z } = require('zod');
const { StructuredOutputParser } = require('langchain/output_parsers');

class LearningTrailController {

	_getSummarizationPipeline = async () => {
		const { pipeline } = await import('@xenova/transformers');
		return await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
	}

	_validateData = (req) => {
		let errors = [];

		if (!req.body.title) {
			errors.push({ error: 'Informe o título da trilha', element: 'title' });
		} else if (req.body.title.length < 3) {
			errors.push({ error: 'O título deve ter no mínimo 3 caracteres', element: 'title' });
		}

		if (!req.file) {
			errors.push({ error: 'Informe o arquivo a ser resumido', element: 'file' });
		} else if (req.file.mimetype != 'application/pdf') {
			errors.push({ error: 'O arquivo informado deve ser no formato PDF', element: 'file' });
		}

		if (!req.body.pageStart) {
			errors.push({ error: 'Informe a página que marca o início do conteúdo', element: 'contentStart' });
		}

		if (!req.body.pageEnd) {
			errors.push({ error: 'Informe a página que marca o fim do conteúdo', element: 'contentEnd' });
		}

		return errors;
	}

	_summarizeDocuments = async (documents) => {
		const model = new ChatOpenAI({
			openAIApiKey: process.env.OPENAI_API_KEY,
			model: 'gpt-4o-mini',
			temperature: 0.1
		});

		const outputParser = StructuredOutputParser.fromZodSchema(
			z.array(z.object({
				name: z.string().describe("The name of the section"),
				content: z.string().describe("The content of the section")
			}))
		);

		const prompt = PromptTemplate.fromTemplate(`
			Write a concise summary of the following text delimited by triple backquotes and group then into sections.
			The summarized content must keep the submitted text language.
			Formatting instructions: {formatInstructions}
			Text: \`\`\`{inputText}\`\`\`
		`);

		let summarizedDocuments = [];
		for (let document of documents) {
			const chain = prompt.pipe(model).pipe(outputParser);
			const response = await chain.invoke({
				inputText: document.pageContent,
				formatInstructions: outputParser.getFormatInstructions()
			});

			summarizedDocuments = summarizedDocuments.concat(response);
		}

		return summarizedDocuments;
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

		const loader = new PDFLoader(req.file.path, {
			parsedItemSeparator: ''
		});

		const documents = await loader.load();
		const pageStart = req.body.pageStart;
		const pageEnd = req.body.pageEnd;

		let combinedText = '';
		documents.slice(pageStart - 1, pageEnd - 1).forEach(doc => {
			combinedText += `${doc.pageContent}\n`;
		});

		fs.unlink(`${req.file.destination}/${req.file.filename}`, err => {});

		if (!combinedText) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors: [{ error: 'O arquivo informado não possui texto', element: 'file' }] });
		}

		const splitter = new TokenTextSplitter({
			modelName: "o200k_base",
			chunkSize: 256,
			// chunkSize: 8192,
			// chunkOverlap: 256
			chunkOverlap: 24
		});

		const tokenizedDocuments = await splitter.createDocuments([combinedText]);
		const summarizedChunks = await this._summarizeDocuments(tokenizedDocuments);

		const newTrail = await LearningTrail.create({
			title: req.body.title,
			userId: req.user.id,
			sections: summarizedChunks.map(section => {
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
			return res.status(400).json({ message: 'Houveram erros de validação', errors: [{ error: 'Informe as seções da trilha', element: 'sections' }] });
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