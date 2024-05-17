const keypress = require("keypress");
const readln = require("readline");

// Function to capture input without displaying it
function captureInput(prompt, hide) {
  return new Promise((resolve, reject) => {
    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdout.write(prompt);

    let input = "";
    keypress(process.stdin);

    process.stdin.on("keypress", (ch, key) => {
      if (key && key.name === "c" && key.sequence == "\x03") {
        process.exit();
      }

      if (key && key.name === "return") {
        process.stdin.pause();
        process.stdin.setRawMode(false);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        resolve(input);
      } else if (key && key.name === "backspace") {
        input = input.slice(0, -1);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        if (hide == true) {
          process.stdout.write(prompt);
        } else {
          process.stdout.write(prompt + input);
        }
      } else {
        input += ch;
      }
    });
  });
}

function readLine(prompt) {
  return new Promise((resolve, reject) => {
    const rl = readln.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true, // Necessary for setting raw mode
    });

    // Set raw mode to prevent input from being shown
    process.stdin.setRawMode(true);

    rl.question(prompt, (passkey) => {
      // Restore terminal settings
      rl.close();
      process.stdin.setRawMode(false);
      process.stdout.write("\n"); // Move cursor to the next line after input
      resolve(passkey);
    });

    // Handle CTRL+C to exit without showing input
    process.stdin.on("data", (key) => {
      if (key === "\u0003") {
        process.exit();
      }
    });
  });
}

function readYesNo2(prompt, _default) {
  return new Promise((resolve, reject) => {
    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdout.write(prompt);

    let input = "";
    keypress(process.stdin);

    process.stdin.on("keypress", (ch, key) => {
      if (key && key.name === "c" && key.sequence == "\x03") {
        process.exit();
      }

      if (key && key.name === "return") {
        process.stdin.pause();
        process.stdin.setRawMode(false);
        process.stdout.write("\n");
        resolve(input == "" ? _default : input);
        return resolve(_default);
      } else if (key && key.name === "backspace") {
        input = input.slice(0, -1);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        if (hide == true) {
          process.stdout.write(prompt);
        } else {
          process.stdout.write(prompt + input);
        }
      } else {
        input += ch;
      }
    });
  });
}

async function readPasskey() {
  if (process.env.PASSKEY) {
    process.stdout.write("using PASSKEY from .env\n");
  }

  return process.env.PASSKEY || (await captureInput("Passkey: ", true));
}

module.exports = { captureInput, readLine, readPasskey };
