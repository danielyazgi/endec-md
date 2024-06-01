#!/usr/bin/env node
require("dotenv").config();

const { program } = require("commander");

const run = require("./run");

program
  .name("endec")
  .version("1.0.2")
  .description(
    "A simple command-line interface for encrypting and decrypting strings in markdown files."
  )
  .argument(
    "[encrypted-code]",
    "(optional) Encrypted code (base64) to be decrypt. If provided, all other options will be ignored."
  )
  .option(
    "-d, --decrypt",
    "decrypt content encapsulated by <dec> tags in all targeted files. By default, the program encrypts content encapsulated by <enc> tags"
  )
  .option("-r, --recursive", "do recursive search for markdown files")
  .option(
    "--scan",
    "recursively scans all markdown files. If these is any <enc> tags will exit with code 1 else will exit with code 0. This option have the highest preiority and it is useful with pre-commit hooks"
  )
  .option(
    "-s, --show",
    "shows the decrypted content for a period of time and then clears it.\nIf not specified, the decrypted content will be copied to the clipboard.\nThe dispay time period is 5 seconds by default by can be changes by SHOW_DECRYPTED_SECONDS environment variable."
  )
  .option(
    "-t, --target <string>",
    "specific target path, which can be a markdown file or a directory."
  )
  .option(
    "    --dry-run",
    "dry-run mode; will not write any files, just prints which files will be affected."
  )
  .action((encryptedCode, options) => {
    if (options.dryRun) {
      process.stdout.write("This is a dry run.\n");
    }

    let target = ".";
    if (options.target) {
      target = options.target;
    }
    const opt = { ...options, target, encryptedCode };
    run.run(opt);
  });

program.addHelpText(
  "after",
  `
  This program is designed to search exclusively for markdown files with the .md extension. It identifies tags in the format <enc>content</enc> and encrypts all content encapsulated within these tags. The resulting encrypted tags will appear as follows: **encrypted**<!--<dec>hashed(content)</dec>-->.

  The encryption process is highly secure, utilizing a 256-bit key derived from PBKDF2 with AES-256-GCM. This method incorporates a random 12-byte initialization vector (IV) and produces a Base64-encoded output, ensuring robust encryption of your data.

  By default, this command-line tool will ignore README.md, node_modules, .vscode, and .git  to ensure optimal performance and avoid unnecessary processing.

  For excluding specific files and directories from processing, create a file named .endecignore and list the items to be ignored.

  For multi-line content, use the <enc></enc> tags to enclose the text you wish to encrypt.




  Notes:
   - Nested tags are not supported.
   - Multiple lines can be enclose by <enc> and </enc>.
`
);

program.parse(process.argv);
