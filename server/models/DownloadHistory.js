const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
    url: { type: String, required: true },
    platform: { type: String, required: true },
    format: { type: String, required: true }, // mp3 ya mp4
    downloadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DownloadHistory', downloadSchema);