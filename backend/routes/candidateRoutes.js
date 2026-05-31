const express = require("express");

const router = express.Router();

const upload = require('../utils/upload');

const parsePDF = require('../utils/pdfParser');

const calculateScore = require('../utils/scoreCalculator');

const Candidate = require('../models/Candidate');

const mongoose = require('mongoose');

router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    // Debug: show whether we received a buffer
    console.log('DEBUG upload req.file keys =>', req.file ? Object.keys(req.file) : null);

    if (!req.file || !req.file.buffer) {
      throw new Error('No file uploaded or missing buffer');
    }

    const buffer = req.file.buffer;
    const text = await parsePDF(buffer);
    const jdText = req.body.jd;
    const result = calculateScore(text, jdText);

    // Save file to MongoDB GridFS
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'resumes' });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(buffer);

    uploadStream.on('error', (err) => {
      console.error('GridFS upload error:', err && err.message);
      return res.status(500).json({ error: 'Failed to store resume' });
    });

    uploadStream.on('finish', async (file) => {
      try {
        const resumePath = `gridfs:${file._id.toString()}`;
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
