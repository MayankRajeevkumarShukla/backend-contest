const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();

// Enable CORS for frontend interaction
app.use(cors());

// Multer configuration to handle file upload in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 // Limit file size to 1MB
  }
});

// Endpoint to handle file upload and content retrieval
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file content as a string
    const fileContent = req.file.buffer.toString('utf-8');

    // Optional: Add basic validation if needed
    if (fileContent.trim() === '') {
      return res.status(400).json({ error: 'Empty file content' });
    }

    // Send the file content to the frontend
    res.json({
      message: 'File content successfully retrieved',
      content: fileContent
    });
  } catch (error) {
    res.status(500).json({ error: 'File processing failed' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});