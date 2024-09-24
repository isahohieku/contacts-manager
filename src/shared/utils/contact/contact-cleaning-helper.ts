import readline from 'readline';

/**
 * Recursively parses string properties in an object that represent arrays or objects.
 *
 * @param {object} obj - The object to parse string arrays in.
 * @param {boolean} isRoot - Whether or not the current object is the root object.
 * @return {object} The object with string arrays parsed into actual arrays or objects.
 */
const parseStringArrays = (obj) => {
  // Iterate over each property in the object
  for (const key in obj) {
    // Check if the property is a string and can be JSON parsed
    if (
      typeof obj[key] === 'string' &&
      (obj[key].startsWith('[') || obj[key].startsWith('{'))
    ) {
      try {
        // Attempt to parse the string as JSON
        obj[key] = JSON.parse(obj[key]);

        // Recursively parse nested properties
        parseStringArrays(obj[key]);
      } catch (e) {
        // If JSON parsing fails, ignore and continue
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively handle objects and arrays
      parseStringArrays(obj[key]);
    }
  }
};

/**
 * Recursively removes 'createdAt', 'updatedAt', and 'deletedAt' keys from an object or array of objects.
 *
 * @param {object|array} obj - The object or array of objects to clean.
 * @return {object|array} The cleaned object or array of objects.
 */
const cleanObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (typeof obj === 'object' && obj !== null) {
    const cleanedObj = {};
    for (const key in obj) {
      if (key !== 'createdAt' && key !== 'updatedAt' && key !== 'deletedAt') {
        cleanedObj[key] = cleanObject(obj[key]);
      }
    }
    return cleanedObj;
  }
  return obj;
};

/**
 * Recursively cleans and parses a contact object or array of objects.
 *
 * @param {object|array} data - The contact object or array of objects to clean and parse.
 * @return {object|array} The cleaned and parsed contact object or array of objects.
 */
export const processContactCleanup = <T>(data: T): T => {
  parseStringArrays(data);
  return cleanObject(data);
};

/**
 * Detects the most likely separator in a file content by analyzing the first few lines of the file.
 *
 * @param {ReadableStream} fileStream - The file stream to detect the separator from.
 * @return {string} The most likely separator in the file content.
 */
export const detectSeparator = async (fileStream) => {
  const possibleSeparators = [',', ';', '\t', '|'];
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  const separatorScores = possibleSeparators.map(() => 0); // Scores for each separator
  let totalLines = 0; // Total non-empty lines processed

  // Process the lines in the stream
  for await (const line of rl) {
    lineCount += 1;
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // Count occurrences of each separator in the current line
    possibleSeparators.forEach((separator, index) => {
      const count = trimmedLine.split(separator).length - 1;

      // Award points for lines that have consistent separator use
      if (count > 0) {
        separatorScores[index] += count;
      }
    });

    totalLines++;

    // Stop after reading a few lines (e.g., 5 lines)
    if (lineCount >= 0) {
      break;
    }
  }

  // Check if any separator was consistently used
  const bestSeparatorIndex = separatorScores.indexOf(
    Math.max(...separatorScores),
  );

  if (totalLines > 0 && separatorScores[bestSeparatorIndex] === 0) {
    throw new Error('Unable to detect a valid separator.');
  }

  return possibleSeparators[bestSeparatorIndex];
};
