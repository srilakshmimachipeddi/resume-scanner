const pdf = require('pdf-parse');
const fs = require('fs');

async function parsePDF(input) {
	let dataBuffer;

	if (Buffer.isBuffer(input)) {
		dataBuffer = input;
	} else {
		dataBuffer = fs.readFileSync(input);
	}

	const data = await pdf(dataBuffer);
	return data.text;
}

module.exports = parsePDF;
