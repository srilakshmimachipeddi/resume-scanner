const multer = require('multer');

// Use memory storage so we can handle the file buffer (store to GridFS)
const storage = multer.memoryStorage();

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
module.exports = multer({ storage });
