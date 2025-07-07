// backend/controllers/musicController.js

// Define the static playlist here
// Replace with actual URLs (e.g., to files hosted on S3, a CDN, or other accessible location)
const staticPlaylist = [
  {
    id: 1,
    title: "Calming Nature Sounds",
    description: "Soothing sounds of nature to help you relax",
    tracks: [
      {
        id: 1,
        title: "Forest Stream",
        duration: "10:00",
        url: "https://example.com/forest-stream.mp3"
      },
      {
        id: 2,
        title: "Ocean Waves",
        duration: "15:00",
        url: "https://example.com/ocean-waves.mp3"
      },
      {
        id: 3,
        title: "Peaceful Piano Melody",
        duration: "3:45",
        url: "https://example.com/peaceful_piano.mp3"
      }
    ]
  }
];

const getMusicPlaylist = async (req, res) => {
  try {
    res.json(staticPlaylist);
  } catch (error) {
    console.error('Error fetching music playlist:', error);
    res.status(500).json({ message: 'Error fetching music playlist' });
  }
};

// Alias for getMusicPlaylist to handle /playlists endpoint
const getMusicPlaylists = getMusicPlaylist;

module.exports = {
  getMusicPlaylist,
  getMusicPlaylists
}; 