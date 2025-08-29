import { useRef, useEffect, useState } from "react";
import sampleimage from "./assets/image_st2.png";
import samplevideo from "./assets/stock7.mp4";
import { supabase } from "./supabaseClient"; // Import Supabase client

const Hero = () => {
  const videoRef = useRef(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const fetchUserName = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No authentication token found.");
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.sub;
        const { data: userData, error: userError } = await supabase
        .from("user")
        .select("name")
        .eq("id", userId)
        .single();
        if (userError) throw userError;
        setUserName(userData.name);
      } catch (err) {
        console.error("Error decoding token or fetching user:", err);
      }

    };

    fetchUserName();
  }, []);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play(); // Play the video when hovered
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause(); // Pause the video when hover ends
      videoRef.current.currentTime = 0; // Reset to the beginning
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        {userName ? <><h2>Hi {userName}</h2> <h2>Detect Deepfakes with AI</h2></>: <h2>Detect Deepfakes with AI</h2>}
        <p>Upload images or videos to analyze for potential manipulation</p>
        <div
          className="media-container"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img src={sampleimage} alt="Hero Image" className="hero-image" />
          <video
            ref={videoRef}
            src={samplevideo}
            className="hero-video"
            muted
            loop
            playsInline
          ></video>
        </div>
      </div>
    </section>
  );
};

export default Hero;