const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs-node");
const cv = require("opencv4nodejs");

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
    // IMPORTANT: convert your .h5 to TF.js format first
    const modelPath = path.join(__dirname, "model", "model.json");
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
function preprocessFrame(mat) {
  const resized = mat.resize(new cv.Size(96, 96));
  const rgb = resized.cvtColor(cv.COLOR_BGR2RGB);
  const buffer = Buffer.from(rgb.getData());
  const tensor = tf.node.decodeImage(buffer, 3)
    .div(tf.scalar(255.0))
    .expandDims(0);
  return tensor;
}

// Analyze Image
app.post("/api/analyze/image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!IMAGE_MODEL) return res.status(500).json({ error: "Model not loaded" });

    const imgMat = cv.imread(path.join(UPLOAD_FOLDER, req.file.filename));
    const inputTensor = preprocessFrame(imgMat);
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
    const cap = new cv.VideoCapture(videoPath);

    let frameCount = 0;
    let processed = 0;
    let scores = [];
    const sampleRate = 5; // process every 5th frame

    while (true) {
      let frame = cap.read();
      if (frame.empty) break;

      if (frameCount % sampleRate === 0) {
        const inputTensor = preprocessFrame(frame);
        const prediction = IMAGE_MODEL.predict(inputTensor);
        const confidence = prediction.dataSync()[0];

        scores.push(confidence);
        processed++;

        inputTensor.dispose();
        prediction.dispose();
      }

      frameCount++;
    }

    cap.release();
    fs.unlinkSync(videoPath);

    if (processed === 0) {
      return res.json({
        is_deepfake: -1,
        confidence: 0,
        message: "No frames processed in video",
      });
    }

    const avgConfidence = scores.reduce((a, b) => a + b, 0) / processed;
    res.json({
      is_deepfake: avgConfidence > 0.5 ? 1 : 0,
      confidence: avgConfidence,
      message: `Analyzed ${processed} frames out of ${frameCount}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://0.0.0.0:${PORT}`));
