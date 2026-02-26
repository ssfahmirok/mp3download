"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState("360p");
  const [error, setError] = useState("");
  const [data, setData] = useState({});//pour la gestion des données plus facilement
  const [loading, setLoading] = useState(false); //Ajout de loading pour le chargement

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const response = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl }), // quality ga perlu untuk mp3
    });

    if (!response.ok) {
      // kalau error dari server masih json
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Une erreur s'est produite");
    }

    const blob = await response.blob(); // ✅ PENTING: BUKAN response.json()

const disposition = response.headers.get("content-disposition") || "";
const match = disposition.match(/filename="(.+?)"/);
const filename = match?.[1] || "audio.mp3";

const url = window.URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = filename; // ✅ ikut title dari server
document.body.appendChild(a);
a.click();
a.remove();
window.URL.revokeObjectURL(url);

  } catch (err) {
    setError(err.message || "Une erreur s'est produite. Veuillez réessayer.");
  } finally {
    setLoading(false);
  }
};

  // Effet pour déclencher le téléchargement automatique
  useEffect(() => {
    if (data.downloadLink) {
      const link = document.createElement("a");
      link.href = data.downloadLink;
      link.setAttribute("download", "video.mp4");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [data.downloadLink]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          YouTube Video Downloader
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-gray-700"
            >
              Enter YouTube Video URL:
            </label>
            <input
              type="text"
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label
              htmlFor="quality"
              className="block text-sm font-medium text-gray-700"
            >
              Select Quality:
            </label>
            <select
              id="quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="144p">144p</option>
              <option value="360p">360p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Téléchargement..." : "Download"}
          </button>
        </form>

        {error && (
          <div className="mt-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {data.downloadLink && (
          <div className="mt-6 text-center">
            <p className="text-green-600">Téléchargement démarré !</p>
          </div>
        )}
      </div>
    </div>
  );
}