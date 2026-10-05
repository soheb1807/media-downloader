const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');
const os = require('os'); 
const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static'); 
const DownloadHistory = require('../models/DownloadHistory');
const { getVideoDetails } = require('../services/extractorService');

const getVideoInfo = async (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });
    url = url.trim().replace(/[\[\]"']/g, '');

    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            skipDownload: true,
        });

        res.json({
            success: true,
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration_string,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not fetch details." });
    }
};

const processDownload = async (req, res) => {
    let { url, type, quality, start, end } = req.query;

    if (!url) return res.status(400).json({ success: false, message: "URL is required" });
    url = url.trim().replace(/[\[\]"']/g, '');

    try {
        const details = await getVideoDetails(url);
        DownloadHistory.create({ 
            url: details.url, 
            platform: details.platform, 
            format: type === 'audio' ? 'mp3' : `${quality}p` 
        }).catch(e => {});

        const isAudio = type === 'audio';
        const fileExtension = isAudio ? 'mp3' : 'mp4';
        const fileName = `AnySaver_${Date.now()}.${fileExtension}`;
        const tempFilePath = path.join(os.tmpdir(), fileName);

        let formatString = isAudio ? 'bestaudio/best' : 
            details.platform === 'YouTube' ? `bestvideo[vcodec^=avc1][height<=${quality}]+bestaudio[ext=m4a]/best[ext=mp4]/best` : 
            'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

        const flags = {
            output: tempFilePath, 
            format: formatString, 
            'js-runtimes': 'node',
            ffmpegLocation: ffmpeg,
            ...(isAudio ? { extractAudio: true, audioFormat: 'mp3' } : { mergeOutputFormat: 'mp4', remuxVideo: 'mp4' })
        };

        if (start && end && start !== '' && end !== '') {
            flags.downloadSections = `*${start}-${end}`;
            flags.forceKeyframesAtCuts = true;
        }

        await youtubedl(url, flags);

        if (!fs.existsSync(tempFilePath)) throw new Error(`File conversion failed.`);

        res.download(tempFilePath, fileName, (err) => {
            fs.unlink(tempFilePath, () => {});
        });
    } catch (error) {
        console.error("Download Error:", error.message);
        if (!res.headersSent) res.status(500).json({ success: false, message: "Server processing failed." });
    }
};

// ✂️ NAYA FUNCTION: Uploaded File Trimming ke liye
// ✂️ UPLOADED FILE TRIMMER (With Audio/Video Support)
const processUploadTrim = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No video file uploaded." });
        }

        let { start, end, type } = req.query;
        start = start || '00:00:00';
        end = end || '00:00:30';
        const isAudio = type === 'audio';

        const inputPath = req.file.path;
        const fileExtension = isAudio ? 'mp3' : 'mp4';
        const outputFileName = `Trimmed_${Date.now()}.${fileExtension}`;
        const outputPath = path.join(os.tmpdir(), outputFileName);

        console.log(`✂️ Trimming uploaded file to ${fileExtension.toUpperCase()} from ${start} to ${end}...`);

        let ffmpegCommand = '';
        if (isAudio) {
            // Agar audio chahiye toh sirf mp3 extract karo
            ffmpegCommand = `"${ffmpeg}" -ss ${start} -to ${end} -i "${inputPath}" -vn -acodec libmp3lame -q:a 2 "${outputPath}" -y`;
        } else {
            // Video ke liye normal cut
            ffmpegCommand = `"${ffmpeg}" -ss ${start} -to ${end} -i "${inputPath}" -c:v libx264 -c:a aac "${outputPath}" -y`;
        }
        
        execSync(ffmpegCommand);
        fs.unlink(inputPath, () => {});

        if (!fs.existsSync(outputPath)) {
            throw new Error("Trimming failed to generate output file.");
        }

        res.download(outputPath, outputFileName, (err) => {
            fs.unlink(outputPath, () => {});
        });

    } catch (error) {
        console.error("Upload Trim Error:", error.message);
        if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Trimming failed. Check time format." });
        }
    }
};

module.exports = { processDownload, getVideoInfo, processUploadTrim };