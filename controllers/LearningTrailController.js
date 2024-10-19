const fs = require('fs');
const LearningTrail = require('../models/LearningTrail');

class LearningTrailController {
	async getSummarizationPipeline() {
		const { pipeline } = await import('@xenova/transformers');
		return await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
	}

	_validateData(req) {
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

		// if (!req.body.contentStart) {
		// 	errors.push({ error: 'Informe a página que marca o início do conteúdo', element: 'contentStart' });
		// }

		// if (!req.body.contentEnd) {
		// 	errors.push({ error: 'Informe a página que marca o fim do conteúdo', element: 'contentEnd' });
		// }

		return errors;
	}

	_splitTextIntoChunks(text) {
		const phrasesPerChunk = 50;
		const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

		const chunks = [];
		for (let i = 0; i < sentences.length; i += phrasesPerChunk) {
			chunks.push(sentences.slice(i, i + phrasesPerChunk).join(' ').trim());
		}

		return chunks;
	}

	async _summarizeChunks(chunks) {
		const pipe = await getSummarizationPipeline();
		const summarizedChunks = [];

		for (let chunk of chunks) {
			let output = await pipe(chunk);
			summarizedChunks.push(output[0].summary_text);
		}

		return summarizedChunks;
	}

	async getAll(req, res) {
		const trails = await LearningTrail.find();
		return res.json(trails);
	}

	async save(req, res) {
		const pdfParse = require('pdf-parse');

		let validationErrors = this._validateData(req);

		if (validationErrors.length) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors: validationErrors });
		}

		/*TODO
		Estratégia para cortar paginas do PDF
			usar lib-pdf q dá pra obter página a página
			com essa lib, criar outro arquivo pdf somente com as páginas do intervalo válido
			ler o arquivo com a lib pdf parse
		*/

		//TODO unificar em uma classe? ler o arquivo somente uma vez ao validar, utilizar o conteúdo lido dps
		let dataBuffer = fs.readFileSync(req.file.path);
		let pdf = await pdfParse(dataBuffer);
		fs.unlink(`${req.file.destination}/${req.file.filename}`, err => { });

		pdf.text = pdf.text.replace(/(\r\n|\n|\r)/gm, ' ').trim();

		if (!pdf.text) {
			return res.status(400).json({ message: 'Houveram erros de validação', errors: [{ error: 'O arquivo informado não possui texto', element: 'file' }] });
		}

		let chunks = this._splitTextIntoChunks(pdf.text);
		let summarizedChunks = await this._summarizeChunks(chunks);

		const newTrail = await LearningTrail.create({
			title: req.body.title,
			sections: summarizedChunks.map((chunk, index) => {
				return { read: false, content: chunk };
			})
		});

		return res.status(201).json({ id: newTrail._id });
	}

	async getById(req, res) {
		const trail = await LearningTrail.findById(req.params.id);

		if (!trail) {
			return res.status(404).json({ message: 'Trilha não encontrada' });
		}

		return res.json(trail);
	}

	async delete(req, res) {
		const trail = await LearningTrail.findByIdAndDelete(req.params.id);

		if (!trail) {
			return res.status(404).send({ message: 'Trilha não encontrado' });
		}

		return res.status(204).send();
	}
}

module.exports = new LearningTrailController();