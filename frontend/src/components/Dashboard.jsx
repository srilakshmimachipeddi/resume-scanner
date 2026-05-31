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
	const [keepCount, setKeepCount] = useState(0);

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		const res = await axios.get(`${apiBaseUrl}/api/candidates/rankings`);
		setCandidates(res.data);
	}

	async function deleteCandidate(id) {
		if (!confirm('Delete this candidate? This cannot be undone.')) return;
		await axios.delete(`${apiBaseUrl}/api/candidates/candidates/${id}`);
		fetchData();
	}

	async function deleteAllBut() {
		const n = parseInt(keepCount || '0', 10);
		if (!confirm(`Delete all candidates except top ${n}? This cannot be undone.`)) return;
		await axios.delete(`${apiBaseUrl}/api/candidates?keep=${n}`);
		fetchData();
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
							<td style={{ padding: 8 }}>
								{c.resumePath && c.resumePath.startsWith('gridfs:') ? (
									<a href={`${apiBaseUrl}/api/candidates/resumes/${c.resumePath.split(':')[1]}`} target="_blank" rel="noreferrer">
										{c.name}
									</a>
								) : (
									c.name
								)}
							</td>
							<td style={{ padding: 8 }}><ScoreBadge score={c.score} /></td>
							<td style={{ padding: 8 }}>{c.matchedSkills.join(', ')}</td>
							<td style={{ padding: 8 }}>{c.missingSkills.join(', ')}</td>
							<td style={{ padding: 8 }}>
								<button onClick={() => deleteCandidate(c._id)} style={{ color: 'white', background: '#e74c3c', border: 'none', padding: '6px 10px', borderRadius: 4 }}>Delete</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div style={{ marginTop: 12 }}>
				<input type="number" min="0" placeholder="Keep top N (0 = delete all)" value={keepCount} onChange={(e) => setKeepCount(e.target.value)} />
				<button onClick={deleteAllBut} style={{ marginLeft: 8, background: '#e74c3c', color: 'white', padding: '6px 8px', border: 'none', borderRadius: 4 }}>Delete all but</button>
			</div>
		</div>
	);
}
 
