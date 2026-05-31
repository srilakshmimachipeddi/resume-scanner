const express = require("express");

const router = express.Router();

const AWS = require('aws-sdk');
const upload = require('../utils/upload');

const parsePDF = require('../utils/pdfParser');

const calculateScore = require('../utils/scoreCalculator');

const Candidate = require('../models/Candidate');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    let text;
    let resumePath;

    // If file was uploaded to S3 (multer-s3), req.file.key is available
    if (req.file && req.file.key) {
      const params = { Bucket: process.env.S3_BUCKET, Key: req.file.key };
      const obj = await s3.getObject(params).promise();
      const buffer = obj.Body;
      text = await parsePDF(buffer);
      resumePath = req.file.location || `s3://${process.env.S3_BUCKET}/${req.file.key}`;
    } else if (req.file && req.file.path) {
      // Local disk fallback
      text = await parsePDF(req.file.path);
      resumePath = req.file.path;
    } else {
      throw new Error('No file uploaded');
    }

    const jdText = req.body.jd;

    const result = calculateScore(text, jdText);

    const candidate = await Candidate.create({
      name: req.file.originalname,
      score: result.score,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      resumePath,
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
