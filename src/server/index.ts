import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { LRUCache } from 'lru-cache';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Configure LRU cache
const cache = new LRUCache({
  max: 500, // Maximum number of items to store
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

app.use(cors());
app.use(express.json());

app.get('/api/validate-word/:word', async (req, res) => {
  try {
    const { word } = req.params;
    
    // Check cache first
    const cached = cache.get(word);
    if (cached !== undefined) {
      return res.json(cached);
    }

    const response = await fetch(`https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(word)}`);
    const html = await response.text();
    
    // If the page contains "Der er ingen resultater med", the word doesn't exist
    const isInvalid = html.includes('Der er ingen resultater med');
    
    const result = {
      isValid: !isInvalid,
      message: !isInvalid ? 'Gyldig' : 'Ikke et gyldigt dansk ord'
    };

    // Cache the result
    cache.set(word, result);
    
    res.json(result);
  } catch (error) {
    console.error('Error validating word:', error);
    res.status(500).json({
      isValid: false,
      message: 'Kunne ikke validere ordet'
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
}); 