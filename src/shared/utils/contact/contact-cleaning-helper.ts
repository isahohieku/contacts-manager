import readline from 'readline';
import { Readable } from 'stream';

/**
 * Recursively parses string properties in an object that represent arrays or objects.
 */
const parseStringArrays = (obj: unknown): void => {
  if (Array.isArray(obj)) {
    obj.forEach((item) => parseStringArrays(item));
    return;
  }

  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj as Record<string, unknown>) {
      const value = (obj as Record<string, unknown>)[key];

      if (
        typeof value === 'string' &&
        (value.startsWith('[') || value.startsWith('{'))
      ) {
        try {
          (obj as Record<string, unknown>)[key] = JSON.parse(value);
          parseStringArrays((obj as Record<string, unknown>)[key]);
        } catch {
          // Ignore JSON parsing errors
        }
      } else if (typeof value === 'object' && value !== null) {
        parseStringArrays(value);
      }
    }
  }
};

/**
 * Recursively removes 'createdAt', 'updatedAt', and 'deletedAt' keys from an object or array.
 */
const cleanObject = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanObject(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const cleanedObj: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (!['createdAt', 'updatedAt', 'deletedAt'].includes(key)) {
        cleanedObj[key] = cleanObject((obj as Record<string, unknown>)[key]);
      }
    }
    return cleanedObj as unknown as T;
  }
  return obj;
};

/**
 * Cleans and parses a contact object or array of objects.
 */
export const processContactCleanup = <T>(data: T): T => {
  parseStringArrays(data);
  return cleanObject(data);
};

/**
 * Detects the most likely separator in a file content by analyzing the first few lines of the file.
 */
export const detectSeparator = async (
  fileStream: Readable,
): Promise<string> => {
  const possibleSeparators: string[] = [',', ';', '\t', '|'];
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  const separatorScores = possibleSeparators.map(() => 0);
  let totalLines = 0;

  for await (const line of rl) {
    lineCount++;
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    possibleSeparators.forEach((separator, index) => {
      const count = trimmedLine.split(separator).length - 1;
      if (count > 0) {
        separatorScores[index] += count;
      }
    });

    totalLines++;
    if (lineCount >= 5) break; // limit to 5 lines
  }

  const bestSeparatorIndex = separatorScores.indexOf(
    Math.max(...separatorScores),
  );

  if (totalLines > 0 && separatorScores[bestSeparatorIndex] === 0) {
    throw new Error('Unable to detect a valid separator.');
  }

  return possibleSeparators[bestSeparatorIndex];
};
