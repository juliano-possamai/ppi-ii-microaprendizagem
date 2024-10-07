const fs = require('fs');

async function getSummarizationPipeline() {
	const { pipeline } = await import('@xenova/transformers');
	return await pipeline('summarization', 'Xenova/bart-large-cnn');
}

function validateData(req) {
	let errors = [];

	if (!req.file) {
		errors.push({ error: 'Informe o arquivo a ser resumido', element: 'file' });
	}

	if (!req.contentStart) {
		errors.push({ error: 'Informe a página que marca o início do conteúdo', element: 'contentStart' });
	}

	if (!req.contentEnd) {
		errors.push({ error: 'Informe a página que marca o fim do conteúdo', element: 'contentEnd' });
	}

	if (errors.length) {
		return errors;
	}

	const filePath = path.join(__dirname, req.file.path);
	fs.stat(filePath, (err, stats) => {
		if (err || !stats.isFile()) {
			errors.push({ error: 'The provided file is not valid', element: 'file' });
		}
	});

	return errors;
}

function splitTextIntoChunks(text) {
	const phrasesPerChunk = 50;
	const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

	const chunks = [];
	for (let i = 0; i < sentences.length; i += phrasesPerChunk) {
		chunks.push(sentences.slice(i, i + phrasesPerChunk).join(' ').trim());
	}

	return chunks;
}

async function summarizeChunks(chunks) {
	const pipe = await getSummarizationPipeline();
	const summarizedChunks = [];

	for (let chunk of chunks) {
		let summarized = await pipe(chunk);
		summarizedChunks.push(summarized);
	}

	return summarizedChunks;
}

module.exports = {
	async getAll(req, res) {
		const trails = await LearningTrail.find();
		return res.json(trails);
	},

	async save(req, res) {
		const pdfParse = require('pdf-parse');

		let validationErrors = validateData(req.body);

		// if (validationErrors.length) {
		// 	return res.status(400).json({ errors: validationErrors });
		// }
		const summarization = await getSummarizationPipeline();

		let dataBuffer = fs.readFileSync('./tmp.pdf');
		let pdf = await pdfParse(dataBuffer);

		let chunks = splitTextIntoChunks(pdf.text, 500);
		let summarizedChunks = summarizeChunks(chunks);

		for (let summarizedChunk of summarizedChunks) {
			//LearningTrail.create(summarizedChunk);
		}

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

	async delete(req, res) {
		await LearningTrail.findByIdAndDelete(req.params.id);
		return res.status(204).send();
	},

};

/*
usuario informa primeira e ultima pagina com conteudo (desconsiderando capa, sumario, etc)
script separa o conteudo em seções com 3k? palavras
resume cada conteudo separadamente
*/