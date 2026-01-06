import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 🔑 PASTE YOUR KEYS HERE 🔑 ---
const API_USER = process.env.SIGHTENGINE_USER;
const API_SECRET = process.env.SIGHTENGINE_SECRET;
const PORT = 5000;

const app = express();
app.use(cors()); // Allows Frontend to connect

// Setup Upload Folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_FOLDER = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER);

const upload = multer({ dest: UPLOAD_FOLDER });

// --- ANALYSIS LOGIC ---
const handleAnalysis = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    try {
        console.log(`Sending ${req.file.originalname} to Sightengine API...`);

        // Prepare data for API
        const data = new FormData();
        data.append('media', fs.createReadStream(filePath));
        data.append('models', 'genai'); // Check for Deepfake/AI
        data.append('api_user', API_USER);
        data.append('api_secret', API_SECRET);

        // Call the API
        const response = await axios({
            method: 'post',
            url: 'https://api.sightengine.com/1.0/check.json',
            data: data,
            headers: data.getHeaders()
        });

        const output = response.data;
        
        // Extract Confidence Score (0.0 to 1.0)
        let confidence = 0.0;
        if (output.type && output.type.ai_generated) {
            confidence = output.type.ai_generated;
        }

        // Cleanup: Delete local file
        fs.unlinkSync(filePath);

        // Send Result to Frontend
        res.json({
            is_deepfake: confidence > 0.5 ? 1 : 0,
            confidence: confidence,
            message: "File analyzed successfully via API"
        });

    } catch (error) {
        console.error("API Error:", error.message);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: "Analysis failed" });
    }
};

// --- ROUTES ---
// We cover both URL patterns to be safe
app.post('/api/analyze/image', upload.single('file'), handleAnalysis);
app.post('/api/analyze/video', upload.single('file'), handleAnalysis);
app.post('/api/image/analyze', upload.single('file'), handleAnalysis);
app.post('/api/video/analyze', upload.single('file'), handleAnalysis);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend running on http://0.0.0.0:${PORT}`);
});