const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const candidateRoutes = require("./routes/candidateRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/candidates", candidateRoutes);

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log("MongoDB Connected");
	})
	.catch((err) => {
		console.log("MongoDB Error:", err.message);
	});

app.get("/", (req, res) => {
	res.send("Resume Screener API Running");
});

app.listen(process.env.PORT || 5000, () => {
	console.log(`Server running on port ${process.env.PORT || 5000}`);
});
