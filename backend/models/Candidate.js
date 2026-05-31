const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({

	name: String,

	score: Number,

	matchedSkills: [String],

	missingSkills: [String],

	resumePath: String

},{
	timestamps:true
});

module.exports = mongoose.model("Candidate", candidateSchema);
