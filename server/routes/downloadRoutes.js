const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');

// Multer setup for temporary file uploads
const upload = multer({ dest: os.tmpdir() });

const { processDownload, getVideoInfo, processUploadTrim } = require('../controllers/downloadController');

router.get('/download', processDownload);
router.get('/info', getVideoInfo);
router.post('/trim-upload', upload.single('video'), processUploadTrim); // Naya route uploaded video trimmer ke liye

module.exports = router;