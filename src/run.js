const fm = require("./files.js");
const em = require("./encdec.js");
const kb = require("./keyboard.js");
const sys = require("./system.js");
 
function countLines(str) {
  // Split the string by newline characters (\n)
  const lines = str.split("\n");

  // Return the number of elements in the resulting array
  return lines.length;
}

async function writeAndClearMessage(message, delay = 5000) {
  let _delay = delay;
  if (process.env.SHOW_DECRYPTED_SECONDS) {
    _delay = 1000 * parseInt(process.env.SHOW_DECRYPTED_SECONDS, 10);
  }

  const lines = message.split("\n"); // Split message into lines
  const linesCount = lines.length;

  process.stdout.write(message + "\n"); // Write the message to stdout with a newline
  process.stdin.pause(); // Pause the stdin to prevent further input

  // Return a promise that resolves after the specified delay
  await new Promise((resolve) => {
    setTimeout(() => {
      for (let i = 0; i < linesCount; i++) {
        process.stdout.write("\x1B[1A"); // Move cursor up one line
        process.stdout.write("\x1B[2K"); // Clear the entire line
      }
      // Optionally log a message after clearing
      process.stdout.write("Message cleared!\n");
      resolve();
    }, _delay);
  });
}
function isAcceptableOption(action) {
  return (
    action === "" ||
    action.toLowerCase() === "y" ||
    action.toLowerCase() === "n"
  );
}

async function decryptInput(options) {
  const passkey = await kb.readPasskey();
  let code = options.encryptedCode;
  // if (!code.endsWith("=")) {
  //   code = code + "=";
  // }

  const decrypted = em.decrypt(code, passkey);
  if (options.show) {
    await writeAndClearMessage("decrypted:\n" + decrypted);
  } else {
    const { default: clipboardy } = await import("clipboardy");

    await clipboardy.write(decrypted);
    process.stdout.write("Copied to clipboard.\n");
  }
}

async function run(options) {
  
  if (options.init) {
    await sys.initializeGitRepository();
    process.exit(0);  
  }

  if (options.scan) {
    const files = fm.findMdFiles(options.target, true);
    const filesList = fm.withPattern(files, true);
    if (filesList.length === 0) {
      process.exit(0);
    } else {
      console.log("These files still contain unecrypted data", filesList);
      process.exit(1);
    }
  }

  // single input
  if (options.encryptedCode) {
    await decryptInput(options);
    process.exit(0);
  }

  // list all markdown files
  const files = fm.findMdFiles(options.target, options.recursive);
  if (files.length === 0) {
    process.stdout.write("No markdown files found in the search locations.\n");
    process.exit(0);
  }

  let action = "NoAcceptable";
  let inputMessage = "Encrypt targeted files? y/[N]: ";
  if (options.decrypt) {
    inputMessage = "Decrypt all targeted files? (Be Careful) y/[N]: ";
  }

  action = await kb.readLine(inputMessage);
  while (!isAcceptableOption(action)) {
    action = await kb.readLine("Enter correct option [y/N]: ");
  }
  const isNo = action === "" || action.toLowerCase() === "n";

  if (isNo) {
    process.exit(0);
  }
  const isEnc = !options.decrypt;
  let filesList = [];

  filesList = fm.withPattern(files, isEnc);

  if (filesList.length === 0) {
    process.stdout.write("No files need to be processed.\n");
    process.exit(0);
  }
  const passkey = await kb.readPasskey();
  filesList.forEach((file) => {
    const readRes = fm.readFile(file);
    const res = em.encryptAndReplace(readRes.content, isEnc, passkey);
    if (res.tag_found && !options.dryRun) {
      fm.saveContent(file, res.content, readRes.encoding);
      process.stdout.write("File processed: " + file + "\n");
    } else {
      process.stdout.write("Dry-run file processed: " + file + "\n");
    }
  });
}

module.exports = { run };
