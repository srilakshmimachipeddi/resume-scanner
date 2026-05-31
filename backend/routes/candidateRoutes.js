const express = require("express");

const router = express.Router();

const upload = require("../utils/upload");

const parsePDF = require("../utils/pdfParser");

const calculateScore = require("../utils/scoreCalculator");

const Candidate = require("../models/Candidate");

router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const text = await parsePDF(filePath);

    const jdText = req.body.jd;

    const result = calculateScore(text, jdText);

    const candidate = await Candidate.create({
      name: req.file.originalname,
      score: result.score,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      resumePath: req.file.path,
    });

    res.json({
      score: result.score,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      candidate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/rankings", async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ score: -1 });

    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/export", async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ score: -1 });

    let csv = "Name,Score\n";

    candidates.forEach((candidate) => {
      csv += `${candidate.name},${candidate.score}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("candidates.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
