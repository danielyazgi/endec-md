const { exec } = require('child_process');

 

// Usage example
//checkGitExists().then(exists => {
//  if (exists) {
//    console.log('Git is installed.');
//  } else {
//    console.log('Git is not installed.');
//  }
//});

const fs = require('fs');
const path = require('path');

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing command: ${command}\n${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function initializeGitRepository() {

   await exec('git --version', (error, stdout, stderr) => {
        if (error) {
        console.error(`exec error: ${error}`);
        process.exit(1)
      }
    });

  try {
    // Initialize git repository
    await runCommand('git init');
    console.log('Git repository initialized.');

    // Create pre-commit hook
    const hookContent = `#!/bin/sh
npx endec --scan
result=$?
if [ $result -ne 0 ]; then
  echo "Some files still contain unencrypted data. Aborting commit."
  exit 1
fi
`;

    const hooksDir = path.join('.git', 'hooks');
    const preCommitHookPath = path.join(hooksDir, 'pre-commit');

    // Ensure hooks directory exists
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir);
    }

    // Write the pre-commit hook
    fs.writeFileSync(preCommitHookPath, hookContent, { mode: 0o755 });
    console.log('pre-commit hook created.');
  } catch (error) {
    console.error(error);
  }
}

module.exports = { initializeGitRepository };