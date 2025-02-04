import { sevenLetterWords, hasUniqueLetters } from '../data/sevenLetterWords';

export interface Puzzle {
  centerLetter: string;
  outerLetters: string[];
  originalWord: string;
}

// Get the base URL for API calls
const getApiUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use the same host as the page
    return '';
  }
  // In development, use localhost:3001
  return 'http://localhost:3001';
};

class PuzzleGenerator {
  private async validateWord(word: string): Promise<boolean> {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/validate-word/${encodeURIComponent(word)}`);
      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error('Error validating word:', error);
      return false;
    }
  }

  private getDailyWord(date: Date): string {
    const dateString = date.toISOString().split('T')[0];
    const dailyWord = sevenLetterWords.find(w => w.date === dateString);
    
    if (!dailyWord) {
      // If no word found for today, use modulo to cycle through the list
      const daysSinceStart = Math.floor(
        (date.getTime() - new Date('2025-02-04').getTime()) / (1000 * 60 * 60 * 24)
      );
      const index = daysSinceStart % sevenLetterWords.length;
      return sevenLetterWords[index].word;
    }
    
    return dailyWord.word;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async generateDailyPuzzle(date: Date = new Date()): Promise<Puzzle> {
    const word = this.getDailyWord(date);
    const letters = word.split('');

    // Use the date to deterministically select the center letter
    const dateString = date.toISOString().split('T')[0];
    const dateHash = Array.from(dateString).reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    const centerIndex = dateHash % letters.length;
    const centerLetter = letters[centerIndex];

    // Remove center letter and arrange remaining letters
    letters.splice(centerIndex, 1);
    const outerLetters = this.shuffleArray(letters);

    return {
      centerLetter,
      outerLetters,
      originalWord: word
    };
  }

  // Validate if a word can be made from the puzzle letters
  isValidPuzzleWord(puzzle: Puzzle, word: string): boolean {
    const puzzleLetters = [...puzzle.outerLetters, puzzle.centerLetter];
    const wordLetters = word.toUpperCase().split('');

    // Check if word contains center letter
    if (!wordLetters.includes(puzzle.centerLetter)) {
      return false;
    }

    // Check if all letters in word are available in puzzle
    return wordLetters.every(letter => puzzleLetters.includes(letter));
  }
}

export const puzzleGenerator = new PuzzleGenerator(); 