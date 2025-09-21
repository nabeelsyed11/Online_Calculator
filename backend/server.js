const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { evaluate } = require('mathjs');
const Tesseract = require('tesseract.js');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure necessary directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

function ensureDirs() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadNotesFromFile() {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const content = fs.readFileSync(NOTES_FILE, 'utf-8');
      return JSON.parse(content || '[]');
    }
    return [];
  } catch (e) {
    console.error('Failed to load notes file:', e);
    return [];
  }
}

function saveNotesToFile(notesArr) {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notesArr, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save notes file:', e);
  }
}

// Initialize filesystem and notes
ensureDirs();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Notes storage (simple file persistence)
let notes = loadNotesFromFile();

// Routes
app.get('/', (req, res) => {
  res.send('Online Calculator Backend API');
});

// Calculator endpoint
app.post('/calculate', (req, res) => {
  try {
    const { expression } = req.body;

    if (!expression) {
      return res.status(400).json({ error: 'Expression is required' });
    }

    // Safe expression evaluation using mathjs
    const result = evaluate(expression);
    res.json({ result, expression });
  } catch (error) {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

// Image upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: req.file.path
    });
  } catch (error) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

// OCR solve endpoint: upload an image and attempt to solve detected math expression
app.post('/solve-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path;
    const { data } = await Tesseract.recognize(imagePath, 'eng');
    const recognizedText = (data && data.text ? data.text : '').trim();

    // Extract a likely math expression from the recognized text
    const expression = extractExpressionFromText(recognizedText);

    let result = null;
    let evalError = null;
    if (expression) {
      try {
        result = evaluate(expression);
      } catch (e) {
        evalError = 'Failed to evaluate expression';
      }
    }

    res.json({
      message: 'OCR processed',
      filename: req.file.filename,
      recognizedText,
      expression: expression || null,
      result,
      error: expression ? evalError : 'No valid expression detected'
    });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Helper: Extract a math expression from OCR text
function extractExpressionFromText(text) {
  if (!text) return null;
  // Normalize common OCR mistakes
  let normalized = text
    .replace(/[×xX]/g, '*')
    .replace(/[–—−]/g, '-')
    .replace(/[÷]/g, '/');

  // Look for a line that looks like a math expression
  const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const exprRegex = /^(?:[-+*/()%^\d\s\.])+$/;
  for (const line of lines) {
    // Remove trailing equals, e.g., "=", "=?"
    const cleaned = line.replace(/=+\s*\?*$/,'').trim();
    if (cleaned && exprRegex.test(cleaned) && /\d/.test(cleaned)) {
      return cleaned;
    }
  }

  // Fallback: try to extract allowed characters from full text
  const fallback = normalized.replace(/[^-+*/()%^\d\.]/g, '');
  if (fallback && /\d/.test(fallback)) return fallback;
  return null;
}

// Notes endpoints
app.get('/notes', (req, res) => {
  res.json(notes);
});

app.post('/notes', (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const note = {
      id: Date.now(),
      title,
      content,
      createdAt: new Date().toISOString()
    };

    notes.push(note);
    saveNotesToFile(notes);
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.delete('/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const noteIndex = notes.findIndex(note => note.id == id);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    notes.splice(noteIndex, 1);
    saveNotesToFile(notes);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
