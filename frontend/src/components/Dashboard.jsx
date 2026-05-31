import React, { useEffect, useState } from "react";
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ScoreBadge({ score }) {
	const color = score >= 75 ? "#2ecc71" : score >= 50 ? "#f39c12" : "#e74c3c";
	return (
		<span style={{ background: color, color: "white", padding: "4px 8px", borderRadius: 6 }}>{score}</span>
	);
}

export default function Dashboard() {
	const [candidates, setCandidates] = useState([]);
	const [query, setQuery] = useState("");
	const [sortDesc, setSortDesc] = useState(true);

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		const res = await axios.get(`${apiBaseUrl}/api/candidates/rankings`);
		setCandidates(res.data);
	}

	const filtered = candidates.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
	const sorted = filtered.sort((a, b) => (sortDesc ? b.score - a.score : a.score - b.score));

	return (
		<div>
			<h2>Candidates</h2>
			<div style={{ marginBottom: 8 }}>
				<input placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} />
				<button onClick={() => setSortDesc((s) => !s)} style={{ marginLeft: 8 }}>
					Sort: {sortDesc ? "Desc" : "Asc"}
				</button>
				<button onClick={() => (window.location.href = `${apiBaseUrl}/api/candidates/export`)} style={{ marginLeft: 8 }}>
					Export CSV
				</button>
			</div>

			<div>Total: {candidates.length}</div>

			<table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th style={{ textAlign: "left", padding: 8 }}>Name</th>
						<th style={{ textAlign: "left", padding: 8 }}>Score</th>
						<th style={{ textAlign: "left", padding: 8 }}>Matched</th>
						<th style={{ textAlign: "left", padding: 8 }}>Missing</th>
					</tr>
				</thead>
				<tbody>
					{sorted.map((c) => (
						<tr key={c._id} style={{ borderTop: "1px solid #eee" }}>
							<td style={{ padding: 8 }}>{c.name}</td>
							<td style={{ padding: 8 }}><ScoreBadge score={c.score} /></td>
							<td style={{ padding: 8 }}>{c.matchedSkills.join(", ")}</td>
							<td style={{ padding: 8 }}>{c.missingSkills.join(", ")}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

