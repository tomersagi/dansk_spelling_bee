import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Button, Container, Snackbar, Alert, LinearProgress, CircularProgress } from '@mui/material';
import { wordValidator } from '../services/wordValidator';
import { puzzleGenerator, Puzzle } from '../services/puzzleGenerator';
import beeImage from '../assets/bee.jpg';

interface GameState {
  centerLetter: string;
  outerLetters: string[];
  foundWords: string[];
  currentWord: string;
  score: number;
  pangrams: string[];
  puzzle: Puzzle;
  highScore: number;
}

interface WordScore {
  word: string;
  score: number;
  isPangram: boolean;
}

const buttonBaseStyle = {
  width: 60,
  height: 60,
  borderRadius: '50%',
  fontSize: '1.25rem',
  fontWeight: 'bold',
};

const outerLetterStyle = {
  ...buttonBaseStyle,
  bgcolor: 'background.paper',
  color: 'text.primary',
  '&:hover': {
    bgcolor: '#e0e0e0',
  },
};

const centerLetterStyle = {
  ...buttonBaseStyle,
  bgcolor: 'primary.main',
  color: 'text.primary',
  '&:hover': {
    bgcolor: 'primary.dark',
  },
};

const backgroundStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: `url(${beeImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.1,
  zIndex: -1,
} as const;

const wordLinkStyle = {
  textDecoration: 'none',
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
};

export const Game: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  // Calculate total possible score (for progress bar)
  const maxPossibleScore = useMemo(() => {
    return 100; // This is just a rough estimate
  }, []);

  // Calculate if a word is a pangram
  const isPangram = (word: string): boolean => {
    if (!gameState) return false;
    const uniqueLetters = new Set(word.toLowerCase());
    return [...gameState.outerLetters, gameState.centerLetter].every(
      letter => uniqueLetters.has(letter.toLowerCase())
    );
  };

  // Calculate score for a word
  const calculateWordScore = (word: string): WordScore => {
    const wordIsPangram = isPangram(word);
    return {
      word,
      score: word.length + (wordIsPangram ? 5 : 0),
      isPangram: wordIsPangram
    };
  };

  // Calculate time until next puzzle
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilNext(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    // Update immediately and then every second
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add function to fetch high score
  const fetchHighScore = async () => {
    try {
      const response = await fetch('/api/todays-high-score');
      const data = await response.json();
      return data.highScore;
    } catch (error) {
      console.error('Error fetching high score:', error);
      return 50; // Default fallback
    }
  };

  // Modify the initGame function in the useEffect
  useEffect(() => {
    const initGame = async () => {
      try {
        const puzzle = await puzzleGenerator.generateDailyPuzzle();
        const highScore = await fetchHighScore();
        setGameState({
          centerLetter: puzzle.centerLetter,
          outerLetters: puzzle.outerLetters,
          foundWords: [],
          currentWord: '',
          score: 0,
          pangrams: [],
          puzzle,
          highScore,
        });
      } catch (error) {
        setMessage({ 
          text: 'Der opstod en fejl ved indlæsning af spillet', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };

    initGame();
  }, []);

  // Add keyboard event handling
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameState) return;

      // Convert to uppercase for comparison
      const key = event.key.toUpperCase();
      const validLetters = [...gameState.outerLetters, gameState.centerLetter];

      if (event.key === 'Enter') {
        handleSubmit();
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        handleDelete();
      } else if (event.key === 'Escape') {
        handleClear();
      } else if (validLetters.includes(key)) {
        handleLetterClick(key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameState]); // Re-add listener when gameState changes

  const handleLetterClick = (letter: string) => {
    setGameState(prev => prev ? ({
      ...prev,
      currentWord: prev.currentWord + letter,
    }) : null);
  };

  const handleDelete = () => {
    setGameState(prev => prev ? ({
      ...prev,
      currentWord: prev.currentWord.slice(0, -1),
    }) : null);
  };

  const handleClear = () => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentWord: ''
      };
    });
  };

  const handleSubmit = async () => {
    if (!gameState) return;

    const word = gameState.currentWord.toLowerCase();
    
    // Check if word contains center letter
    if (!word.includes(gameState.centerLetter.toLowerCase())) {
      setMessage({ text: 'Ordet skal indeholde midterbogstavet', type: 'error' });
      return;
    }

    // Check if word has already been found
    if (gameState.foundWords.includes(word)) {
      setMessage({ text: 'Du har allerede fundet dette ord', type: 'error' });
      return;
    }

    // Check if word can be made from puzzle letters
    if (!puzzleGenerator.isValidPuzzleWord(gameState.puzzle, word)) {
      setMessage({ text: 'Ordet kan ikke dannes af de givne bogstaver', type: 'error' });
      return;
    }

    try {
      const validation = await wordValidator.validateWord(word);
      
      if (validation.isValid) {
        const wordScore = calculateWordScore(word);
        setGameState(prev => prev ? ({
          ...prev,
          foundWords: [...prev.foundWords, word],
          currentWord: '',
          score: prev.score + wordScore.score,
          pangrams: wordScore.isPangram ? [...prev.pangrams, word] : prev.pangrams,
        }) : null);
        
        const message = wordScore.isPangram 
          ? `Pangram! +${wordScore.score} point!` 
          : `+${wordScore.score} point!`;
        setMessage({ text: message, type: 'success' });
      } else {
        setMessage({ text: validation.message || 'Ikke et gyldigt ord', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Der opstod en fejl ved validering af ordet', type: 'error' });
    }
  };

  const handleWordClick = (word: string) => {
    window.open(`https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(word)}`, '_blank');
  };

  if (loading || !gameState) {
    return (
      <Container maxWidth="sm">
        <Box sx={backgroundStyle} />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={backgroundStyle} />
      <Box sx={{ textAlign: 'center', mt: 4, position: 'relative' }}>
        <Typography variant="h4" gutterBottom>
          Dansk Spelling Bee
        </Typography>

        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Næste ord om {timeUntilNext}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary">
              Score: {gameState.score}
            </Typography>
            <Typography variant="h6" color="success.main">
              Daily High Score: {gameState.highScore}
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', mt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={(gameState.score / gameState.highScore) * 100} 
              sx={{ 
                mt: 1,
                height: 8, // Make the progress bar a bit thicker
                backgroundColor: 'rgba(0, 0, 0, 0.1)', // Lighter background
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 2,
                bgcolor: 'success.main',
                transform: 'translateX(50%)',
              }}
            />
          </Box>
        </Box>
        
        <Typography variant="h5" sx={{ mb: 2 }}>
          {gameState.currentWord || ' '}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 2 }}>
          {/* Top row - first two letters */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {gameState.outerLetters.slice(0, 2).map((letter, index) => (
              <Button
                key={index}
                variant="contained"
                onClick={() => handleLetterClick(letter)}
                sx={outerLetterStyle}
              >
                {letter}
              </Button>
            ))}
          </Box>

          {/* Middle row - 2 outer letters + center letter */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => handleLetterClick(gameState.outerLetters[2])}
              sx={outerLetterStyle}
            >
              {gameState.outerLetters[2]}
            </Button>
            
            <Button
              variant="contained"
              onClick={() => handleLetterClick(gameState.centerLetter)}
              sx={centerLetterStyle}
            >
              {gameState.centerLetter}
            </Button>

            <Button
              variant="contained"
              onClick={() => handleLetterClick(gameState.outerLetters[3])}
              sx={outerLetterStyle}
            >
              {gameState.outerLetters[3]}
            </Button>
          </Box>

          {/* Bottom row - last two letters */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {gameState.outerLetters.slice(4).map((letter, index) => (
              <Button
                key={index + 4}
                variant="contained"
                onClick={() => handleLetterClick(letter)}
                sx={outerLetterStyle}
              >
                {letter}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Button variant="outlined" onClick={handleDelete}>
            Slet
          </Button>
          <Button variant="outlined" onClick={handleClear}>
            Ryd
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Enter
          </Button>
        </Box>

        <Box>
          <Typography variant="h6">
            Fundne ord ({gameState.foundWords.length})
            {gameState.pangrams.length > 0 && ` • Pangrams: ${gameState.pangrams.length}`}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {gameState.foundWords.map((word, index) => (
              <Typography 
                key={index} 
                component="span"
                onClick={() => handleWordClick(word)}
                color={gameState.pangrams.includes(word) ? 'primary' : 'inherit'}
                sx={{
                  ...wordLinkStyle,
                  fontWeight: gameState.pangrams.includes(word) ? 'bold' : 'normal',
                }}
              >
                {word}
              </Typography>
            ))}
          </Box>
        </Box>

        <Snackbar
          open={message !== null}
          autoHideDuration={3000}
          onClose={() => setMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={message?.type} onClose={() => setMessage(null)}>
            {message?.text}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}; 