async function getSummarizationPipeline() {
	const { pipeline } = await import('@xenova/transformers');
	return await pipeline('summarization', 'Xenova/bart-large-cnn');
}

const fs = require('fs');
const pdfParse = require('pdf-parse');

function splitTextIntoChunks(text) {
	const phrasesPerChunk = 50;
	const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

	const chunks = [];
	for (let i = 0; i < sentences.length; i += phrasesPerChunk) {
		chunks.push(sentences.slice(i, i + phrasesPerChunk).join(' ').trim());
	}

	return chunks;
}

async function readInChunks(filePath, startPage, endPage) {
	const dataBuffer = fs.readFileSync(filePath);

	let pdf = await pdfParse(dataBuffer);
	let chunks = splitTextIntoChunks(pdf.text, 500);

	let pipe = await getSummarizationPipeline();
	for (let chunk of chunks) {
		let summarized = await pipe(chunk);
		//gravar
	}
}

extractPdfPages('./tmp.pdf', 2, 5)
	.then(text => console.log(text))
	.catch(err => console.error(err));