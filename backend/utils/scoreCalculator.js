function calculateScore(resumeText, jdText) {

	const skills = [
		"java",
		"python",
		"sql",
		"react",
		"node",
		"express",
		"mongodb",
		"mysql",
		"aws",
		"docker",
		"git",
		"html",
		"css",
		"javascript",
	];

	const matchedSkills = [];
	const missingSkills = [];

	skills.forEach((skill) => {
		const inJD = jdText.toLowerCase().includes(skill);
		const inResume = resumeText.toLowerCase().includes(skill);

		if (inJD && inResume) matchedSkills.push(skill);
		if (inJD && !inResume) missingSkills.push(skill);
	});

	const total = matchedSkills.length + missingSkills.length;
	const score =
		total === 0 ? 0 : Math.round((matchedSkills.length / total) * 100);

	return {
		score,
		matchedSkills,
		missingSkills,
	};
}

module.exports = calculateScore;

