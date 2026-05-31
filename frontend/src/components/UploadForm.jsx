import React, { useState } from "react";
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

function UploadForm() {
	const [resume, setResume] = useState(null);
	const [jd, setJd] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();

		const formData = new FormData();
		formData.append("resume", resume);
		formData.append("jd", jd);

		const response = await axios.post(`${apiBaseUrl}/api/candidates/upload`, formData);

		alert(`Candidate Score: ${response.data.score}`);
		window.location.reload();
	};

	return (
		<div>
			<h2>Resume Analyzer</h2>

			<form onSubmit={handleSubmit}>
				<input type="file" onChange={(e) => setResume(e.target.files[0])} />
				<br />
				<br />

				<textarea rows="6" cols="80" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste Job Description"></textarea>

				<br />
				<br />

				<button type="submit">Analyze Resume</button>
			</form>
		</div>
	);
}

export default UploadForm;

