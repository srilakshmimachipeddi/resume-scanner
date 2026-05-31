const express = require("express");

const router = express.Router();

const upload = require('../utils/upload');

const parsePDF = require('../utils/pdfParser');

const calculateScore = require('../utils/scoreCalculator');

const Candidate = require('../models/Candidate');

const mongoose = require('mongoose');

router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    // receive file buffer

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

// Download resume from GridFS by id
router.get('/resumes/:id', async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'resumes' });

    const files = await bucket.find({ _id: id }).toArray();
    if (!files || files.length === 0) return res.status(404).send('Not found');

    const fileDoc = files[0];
    res.set('Content-Type', fileDoc.contentType || 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${fileDoc.filename}"`);

    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err && err.message);
      res.status(500).end();
    });
    downloadStream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete candidate and associated GridFS file
router.delete('/candidates/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const candidate = await Candidate.findById(id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // If resumePath points to GridFS, delete the file
    if (candidate.resumePath && candidate.resumePath.startsWith('gridfs:')) {
      const fileId = candidate.resumePath.split(':')[1];
      try {
        const db = mongoose.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'resumes' });
        await bucket.delete(new mongoose.Types.ObjectId(fileId));
      } catch (err) {
        console.error('Failed to delete GridFS file:', err && err.message);
        // continue to delete candidate record even if file delete fails
      }
    }

    await Candidate.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete: delete all candidates except top N (by score)
// Usage: DELETE /api/candidates?keep=10   (keeps top 10)
router.delete('/', async (req, res) => {
  try {
    const keep = parseInt(req.query.keep || '0', 10);

    const allCandidates = await Candidate.find().sort({ score: -1 }).select('_id resumePath');

    if (keep <= 0) {
      // delete everything
      for (const c of allCandidates) {
        if (c.resumePath && c.resumePath.startsWith('gridfs:')) {
          try {
            const fileId = c.resumePath.split(':')[1];
            const db = mongoose.connection.db;
            const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'resumes' });
            await bucket.delete(new mongoose.Types.ObjectId(fileId));
          } catch (err) {
            console.error('GridFS delete error (bulk):', err && err.message);
          }
        }
        await Candidate.findByIdAndDelete(c._id);
      }
      return res.json({ ok: true, deleted: allCandidates.length });
    }

    // keep top `keep` candidates, delete the rest
    const toKeep = allCandidates.slice(0, keep).map((c) => c._id.toString());
    const toDelete = allCandidates.slice(keep);

    for (const c of toDelete) {
      if (c.resumePath && c.resumePath.startsWith('gridfs:')) {
        try {
          const fileId = c.resumePath.split(':')[1];
          const db = mongoose.connection.db;
          const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'resumes' });
          await bucket.delete(new mongoose.Types.ObjectId(fileId));
        } catch (err) {
          console.error('GridFS delete error (bulk):', err && err.message);
        }
      }
      await Candidate.findByIdAndDelete(c._id);
    }

    return res.json({ ok: true, kept: toKeep.length, deleted: toDelete.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
