const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { TokenTextSplitter } = require('langchain/text_splitter');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { z } = require('zod');
const { StructuredOutputParser } = require('langchain/output_parsers');

class SummarizerService {

	constructor(filePath, pageStart, pageEnd) {
		this.document = [];
		this.filePath = filePath;
		this.pageStart = parseInt(pageStart);
		this.pageEnd = parseInt(pageEnd);
	}

	validate = async() => {
		const errors = [];
		const document = await this._getDocument();
		if (!document.length) {
			errors.push({ error: 'O arquivo informado não possui texto', field: 'file' });
			return errors;
		}

		if (this.pageStart < 1 || this.pageStart > document.length) {
			errors.push({ error: 'A página inicial está fora do intervalo do documento', field: 'pageStart' });
		}

		if (this.pageEnd && this.pageEnd > document.length) {
			errors.push({ error: 'A página final está fora do intervalo do documento', field: 'pageEnd' });
		}

		if (this.pageEnd && this.pageStart > this.pageEnd) {
			errors.push({ error: 'A página inicial não pode ser maior que a página final', field: 'pageStart' });
		}

		return errors;
	}

	summarize = async () => {
		const model = this._getModel();
		const outputParser = this._getOutputParser();
		const prompt = this._getPromptTemplate();

		const tokenizedDocuments = await this._splitContentIntoChunks();

		let summarizedDocuments = [];
		for (let document of tokenizedDocuments) {
			const chain = prompt.pipe(model).pipe(outputParser);
			const response = await chain.invoke({
				inputText: document.pageContent,
				formatInstructions: outputParser.getFormatInstructions()
			});

			summarizedDocuments = summarizedDocuments.concat(response);
		}

		return summarizedDocuments;
	}

	_getModel = () => {
		return new ChatOpenAI({
			openAIApiKey: process.env.OPENAI_API_KEY,
			model: 'gpt-4o-mini',
			temperature: 0.1
		});
	}

	_getOutputParser = () => {
		return StructuredOutputParser.fromZodSchema(
			z.array(z.object({
				name: z.string().describe("The name of the section"),
				content: z.string().describe("The content of the section")
			}))
		);
	}

	_getPromptTemplate = () => {
		return PromptTemplate.fromTemplate(`
			Write a concise summary of the following text delimited by triple backquotes and group then into sections.
			The summarized content must keep the submitted text language.
			Formatting instructions: {formatInstructions}
			Text: \`\`\`{inputText}\`\`\`
		`);
	}

	_getDocument = async() => {
		if (this.document.length) {
			return this.document;
		}

		await this._setDocument();
		return this.document;
	}

	_setDocument = async() => {
		const loader = new PDFLoader(this.filePath, { parsedItemSeparator: '' });
		this.document = await loader.load();
	}

	_getDocumentContent = async() => {
		let combinedText = '';
		const document = await this._getDocument();
		document.slice(this.pageStart - 1, this.pageEnd ? this.pageEnd - 1 : document.length).forEach(doc => {
			combinedText += `${doc.pageContent}\n`;
		});

		return combinedText;
	}

	_splitContentIntoChunks = async() => {
		const splitter = new TokenTextSplitter({
			modelName: "o200k_base",
			chunkSize: 8192,
			chunkOverlap: 256
			// chunkSize: 256,
			// chunkOverlap: 24
		});

		const content = await this._getDocumentContent();
		return await splitter.createDocuments([content]);
	}

}

module.exports = SummarizerService;