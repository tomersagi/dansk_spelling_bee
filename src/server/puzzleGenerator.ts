// Move and modify the puzzle generator for server use
interface DailyWord {
  word: string;
  date: string;
  meaning: string;
}

// Copy the sevenLetterWords array directly here to avoid import issues
const sevenLetterWords: DailyWord[] = [
  // ... copy the array from sevenLetterWords.ts ...
];

export interface Puzzle {
  centerLetter: string;
  outerLetters: string[];
  originalWord: string;
}

class PuzzleGenerator {
  private getDailyWord(date: Date): string {
    const dateString = date.toISOString().split('T')[0];
    const dailyWord = sevenLetterWords.find(w => w.date === dateString);
    
    if (!dailyWord) {
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

    const dateString = date.toISOString().split('T')[0];
    const dateHash = Array.from(dateString).reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    const centerIndex = dateHash % letters.length;
    const centerLetter = letters[centerIndex];

    letters.splice(centerIndex, 1);
    const outerLetters = this.shuffleArray(letters);

    return {
      centerLetter,
      outerLetters,
      originalWord: word
    };
  }

  isValidPuzzleWord(puzzle: Puzzle, word: string): boolean {
    const puzzleLetters = [...puzzle.outerLetters, puzzle.centerLetter];
    const wordLetters = word.toUpperCase().split('');

    if (!wordLetters.includes(puzzle.centerLetter)) {
      return false;
    }

    return wordLetters.every(letter => puzzleLetters.includes(letter));
  }
}

export const puzzleGenerator = new PuzzleGenerator(); 