# 🕵️‍♂️ Deepfake Detector

A full-stack web application designed to detect manipulated media. This tool analyzes images and videos to determine if they are "Real" or "Fake" using advanced facial analysis and AI detection APIs.

## 🚀 Live Demo
**Frontend:** [https://deepfakedetector-frontend.onrender.com](https://deepfakedetector-frontend.onrender.com)  
**Backend:** [https://deepfakedetector-s3gs.onrender.com](https://deepfakedetector-s3gs.onrender.com)

---

## ✨ Features

* **Dual Detection Modes:**
    * 📸 **Image Analysis:** Upload JPG/PNG files to detect facial manipulation.
    * 🎥 **Video Detection:** Analyze video frames (MP4/AVI/MOV) for deepfake artifacts.
* **Real-time Analysis:** Instant feedback with a confidence score (e.g., "98% Fake").
* **User Authentication:** Secure Login and Signup using Supabase Auth.
* **History Tracking:** Logged-in users can view their past analysis results.
* **Cloud Storage:** Automatically saves analyzed media to Supabase Storage.
* **Drag & Drop Interface:** User-friendly upload zone with progress bars.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React (Vite)
* **Styling:** CSS3, Responsive Design
* **State Management:** React Hooks
* **HTTP Client:** Fetch API / XMLHttpRequest

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **AI Service:** SightEngine API (for deepfake detection)
* **Middleware:** CORS, Multer (for file handling)

### Database & Storage
* **Database:** Supabase (PostgreSQL)
* **Storage:** Supabase Storage (Buckets)
* **Auth:** Supabase Authentication

---

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` files.

### Backend (`/backend/.env`)
```env
SIGHTENGINE_USER=your_sightengine_api_user
SIGHTENGINE_SECRET=your_sightengine_api_secret
PORT=5000
