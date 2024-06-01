const fs = require("fs");
const path = require("path");
const jschardet = require("jschardet");
const ignore = require("ignore");

let endecignoreContent = `
node_modules
.sample
.git
.vscode
README.md
`;
if (fs.existsSync(".endecignore")) {
  // Read .gitignore content from file
  endecignoreContent = fs.readFileSync(".endecignore", "utf8");
}

// Initialize the ignore instance
const ig = ignore().add(endecignoreContent);

// Function to recursively find files matching a pattern in a directory, excluding specified directories
function findFiles(target, recursive, pattern, filesList = []) {
  if (!fs.existsSync(target)) {
    return filesList;
  }
  const files = fs.readdirSync(target);

  files.forEach((file) => {
    const filePath = path.join(target, file);
    if (!ig.ignores(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (recursive) {
          findFiles(filePath, recursive, pattern, filesList); // Recursively search in subdirectories
        }
      } else if (file.match(pattern)) {
        filesList.push(filePath); // Add file path to the list if it matches the pattern
      }
    }
  });

  return filesList;
}

function saveContent(filePath, content, encoding) {
  try {
    fs.writeFileSync(filePath, content, encoding);
  } catch (err) {
    throw err;
  }
}

function withPattern(filesList, isEnc) {
  const stag = isEnc ? "<enc>" : "**encrypted**<!--<dec>";
  const res = [];
  for (const file of filesList) {
    try {
      const readRes = readFile(file);
      const encStartIndex = readRes.content.indexOf(stag, 0);
      if (encStartIndex !== -1) {
        res.push(file);
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  return res;
}

// Function to read the content of a file as UTF-8 encoded text
function readFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const encodingResult = jschardet.detect(fileContent);
    const data = Buffer.from(fileContent, encodingResult.encoding).toString();
    return { encoding: encodingResult.encoding, content: data };
  } catch (err) {
    throw err;
  }
}

function readJsonIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading JSON file ${filePath}:`, error);
      return null;
    }
  } else {
    console.error(`JSON file ${filePath} does not exist.`);
    return null;
  }
}

// Example usage:
const filePattern = /\.md$/i; // Regular expression pattern to match files ending with '.md'

function findMdFiles(target, recursive) {
  if (target != "." && ig.ignores(target)) {
    process.stdout.write(`The path "${target}" is ignored by .endecignore`);
    process.exit(1);
  }
  return findFiles(target, recursive, filePattern);
}

module.exports = { findMdFiles, readFile, saveContent, withPattern };
