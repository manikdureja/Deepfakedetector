import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import tf from "@tensorflow/tfjs-node";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const app = express();
app.use(cors());

// Upload folder
const UPLOAD_FOLDER = "uploads";
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Load models
let IMAGE_MODEL;
(async () => {
  try {
    const modelPath = path.join(process.cwd(), "model", "converted_model", "model.json");
    IMAGE_MODEL = await tf.loadLayersModel("file://" + modelPath);
    console.log("Image/Video model loaded successfully");

    // Warm up model
    const dummy = tf.zeros([1, 96, 96, 3]);
    IMAGE_MODEL.predict(dummy).dispose();
  } catch (err) {
    console.error("Error loading model:", err);
  }
})();

// Preprocess single frame or image
async function preprocessImage(filePath) {
  const buffer = fs.readFileSync(filePath);
  let tensor = tf.node.decodeImage(buffer, 3);
  tensor = tf.image.resizeBilinear(tensor, [96, 96]);
  tensor = tensor.div(255.0).expandDims(0);
  return tensor;
}

// Analyze Image
app.post("/api/analyze/image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!IMAGE_MODEL) return res.status(500).json({ error: "Model not loaded" });

    const inputTensor = await preprocessImage(
      path.join(UPLOAD_FOLDER, req.file.filename)
    );
    const prediction = IMAGE_MODEL.predict(inputTensor);
    const confidence = prediction.dataSync()[0];

    inputTensor.dispose();
    prediction.dispose();
    fs.unlinkSync(path.join(UPLOAD_FOLDER, req.file.filename));

    res.json({
      is_deepfake: confidence > 0.5 ? 1 : 0,
      confidence,
      message: "Image analyzed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Analyze Video
app.post("/api/analyze/video", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!IMAGE_MODEL) return res.status(500).json({ error: "Model not loaded" });

    const videoPath = path.join(UPLOAD_FOLDER, req.file.filename);
    const framesDir = path.join(UPLOAD_FOLDER, "frames");

    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

    // Extract frames every 5th frame
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setFfmpegPath(ffmpegPath)
        .output(path.join(framesDir, "frame-%03d.jpg"))
        .outputOptions(["-vf fps=1/5"]) // 1 frame every 5 seconds
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    const frameFiles = fs.readdirSync(framesDir);
    if (frameFiles.length === 0) {
      return res.json({
        is_deepfake: -1,
        confidence: 0,
        message: "No frames processed in video",
      });
    }

    let scores = [];
    for (const file of frameFiles) {
      const tensor = await preprocessImage(path.join(framesDir, file));
      const prediction = IMAGE_MODEL.predict(tensor);
      const confidence = prediction.dataSync()[0];

      scores.push(confidence);

      tensor.dispose();
      prediction.dispose();
      fs.unlinkSync(path.join(framesDir, file));
    }

    fs.unlinkSync(videoPath);

    const avgConfidence = scores.reduce((a, b) => a + b, 0) / scores.length;
    res.json({
      is_deepfake: avgConfidence > 0.5 ? 1 : 0,
      confidence: avgConfidence,
      message: `Analyzed ${scores.length} frames`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://0.0.0.0:${PORT}`));