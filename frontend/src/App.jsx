import React from "react";
import UploadForm from "./components/UploadForm";
import Dashboard from "./components/Dashboard";

function App() {
	return (
		<div style={{ padding: 20 }}>
			<h1>Resume Screener</h1>
			<UploadForm />
			<hr />
			<Dashboard />
		</div>
	);
}

export default App;

