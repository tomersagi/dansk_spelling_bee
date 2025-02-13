import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { LRUCache } from 'lru-cache';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { puzzleGenerator } from './puzzleGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);
const host = process.env.HOST || '0.0.0.0';

// Add interface for word validation
interface WordValidation {
  isValid: boolean;
  message: string;
}

interface DailyWords {
  date: string;
  words: Map<string, boolean>; // word -> isValid
  highScore: number;
  pangram: string;
}

// Configure LRU cache and daily words tracking
const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60 * 24,
});

let dailyWords: DailyWords = {
  date: new Date().toISOString().split('T')[0],
  words: new Map(),
  highScore: 0,
  pangram: ''
};

// Add function to initialize daily words with pangram
async function initializeDailyWords(pangram: string) {
  dailyWords.pangram = pangram;
  dailyWords.words.set(pangram.toLowerCase(), true);
}

// Add function to reset daily words if needed
async function checkAndResetDailyWords() {
  const currentDate = new Date().toISOString().split('T')[0];
  if (dailyWords.date !== currentDate) {
    // Get today's puzzle to get the pangram
    try {
      const puzzle = await puzzleGenerator.generateDailyPuzzle(new Date());
      
      dailyWords = {
        date: currentDate,
        words: new Map(),
        highScore: 0,
        pangram: puzzle.originalWord
      };
      
      // Initialize with the pangram
      dailyWords.words.set(puzzle.originalWord.toLowerCase(), true);
    } catch (error) {
      console.error('Error getting daily puzzle pangram:', error);
      // Fallback to empty initialization if puzzle generation fails
      dailyWords = {
        date: currentDate,
        words: new Map(),
        highScore: 0,
        pangram: ''
      };
    }
  }
}

// Modify the function to calculate word score (add this near the top)
function calculateWordScore(word: string, letters: string[]): number {
  // Check if it's a pangram (uses all letters)
  const uniqueLetters = new Set(word.toLowerCase());
  const isPangram = letters.every(letter => uniqueLetters.has(letter.toLowerCase()));
  return word.length + (isPangram ? 5 : 0);
}

app.use(cors());
app.use(express.json());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // In production, static files are in the dist directory
  const clientPath = join(process.cwd(), 'dist/client');
  console.log('Looking for static files in:', clientPath);
  
  if (!existsSync(clientPath)) {
    console.error('Client path does not exist:', clientPath);
    console.log('Current directory:', process.cwd());
    console.log('Directory contents:', readdirSync(process.cwd()));
  }
  
  app.use(express.static(clientPath));
}

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Modify the GET endpoint for today's high score
app.get('/api/todays-high-score', (req, res) => {
  checkAndResetDailyWords();
  
  // Get all valid words
  const validWords = Array.from(dailyWords.words.entries())
    .filter(([_, isValid]) => isValid)
    .map(([word]) => word);

  // Calculate total possible score from all valid words
  const letters = Array.from(new Set(validWords.join(''))); // Get unique letters for pangram checking
  const totalScore = validWords.reduce((sum, word) => sum + calculateWordScore(word, letters), 0);
  
  // Return at least 50 as the minimum high score
  const highScore = Math.max(50, totalScore);
  res.json({ highScore });
});

// Modify the validate-word endpoint
app.get('/api/validate-word/:word', async (req, res) => {
  try {
    const { word } = req.params;
    checkAndResetDailyWords();
    
    // First check daily words
    if (dailyWords.words.has(word)) {
      const isValid = dailyWords.words.get(word);
      const result = {
        isValid,
        message: isValid ? 'Gyldig' : 'Ikke et gyldigt dansk ord'
      };
      return res.json(result);
    }
    
    // Then check cache
    const cached = cache.get(word);
    if (cached !== undefined) {
      // Add to daily words
      dailyWords.words.set(word, (cached as WordValidation).isValid);
      return res.json(cached);
    }

    // If not found, check ordnet.dk
    const response = await fetch(`https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(word)}`);
    const html = await response.text();
    
    const isInvalid = html.includes('Der er ingen resultater med');
    
    const result = {
      isValid: !isInvalid,
      message: !isInvalid ? 'Gyldig' : 'Ikke et gyldigt dansk ord'
    };

    // Cache the result and add to daily words
    cache.set(word, result);
    dailyWords.words.set(word, !isInvalid);
    
    res.json(result);
  } catch (error) {
    console.error('Error validating word:', error);
    res.status(500).json({
      isValid: false,
      message: 'Kunne ikke validere ordet'
    });
  }
});

// Handle React routing, return all requests to React app
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const indexPath = join(process.cwd(), 'dist/client/index.html');
    console.log('Serving index.html from:', indexPath);
    
    if (!existsSync(indexPath)) {
      console.error('index.html not found at:', indexPath);
      return res.status(404).send('Application files not found');
    }
    
    res.sendFile(indexPath);
  });
}

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
try {
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Current working directory:', process.cwd());
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 