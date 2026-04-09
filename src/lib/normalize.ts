const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А", B: "В", C: "С", E: "Е", H: "Н", K: "К", M: "М", O: "О", P: "Р", T: "Т", X: "Х",
  a: "а", c: "с", e: "е", o: "о", p: "р", x: "х", y: "у",
};

const CYRILLIC_TO_LATIN: Record<string, string> = {};
for (const [lat, cyr] of Object.entries(LATIN_TO_CYRILLIC)) {
  CYRILLIC_TO_LATIN[cyr] = lat;
}

function isCyrillic(ch: string): boolean {
  return /[а-яёА-ЯЁ]/.test(ch);
}

function isLatin(ch: string): boolean {
  return /[a-zA-Z]/.test(ch);
}

interface MixedWord {
  original: string;
  normalized: string;
  changes: { index: number; from: string; to: string }[];
}

function analyzeWord(word: string): MixedWord | null {
  let cyrCount = 0;
  let latCount = 0;

  for (const ch of word) {
    if (isCyrillic(ch)) cyrCount++;
    if (isLatin(ch)) latCount++;
  }

  if (cyrCount === 0 || latCount === 0) return null;

  const changes: MixedWord["changes"] = [];
  let normalized = "";

  if (cyrCount >= latCount) {
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (isLatin(ch) && LATIN_TO_CYRILLIC[ch]) {
        changes.push({ index: i, from: ch, to: LATIN_TO_CYRILLIC[ch] });
        normalized += LATIN_TO_CYRILLIC[ch];
      } else {
        normalized += ch;
      }
    }
  } else {
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (isCyrillic(ch) && CYRILLIC_TO_LATIN[ch]) {
        changes.push({ index: i, from: ch, to: CYRILLIC_TO_LATIN[ch] });
        normalized += CYRILLIC_TO_LATIN[ch];
      } else {
        normalized += ch;
      }
    }
  }

  if (changes.length === 0) return null;

  return { original: word, normalized, changes };
}

export function normalizeText(text: string): string {
  return text.replace(/[a-zA-Zа-яёА-ЯЁ]+/g, (word) => {
    const result = analyzeWord(word);
    return result ? result.normalized : word;
  });
}

export function findMixedWords(text: string): MixedWord[] {
  const results: MixedWord[] = [];
  text.replace(/[a-zA-Zа-яёА-ЯЁ]+/g, (word) => {
    const result = analyzeWord(word);
    if (result) results.push(result);
    return word;
  });
  return results;
}

export function hasMixedSymbols(text: string): boolean {
  let found = false;
  text.replace(/[a-zA-Zа-яёА-ЯЁ]+/g, (word) => {
    if (!found) {
      found = analyzeWord(word) !== null;
    }
    return word;
  });
  return found;
}
