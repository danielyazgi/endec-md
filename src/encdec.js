const crypto = require("crypto");

// Function to replace <enc> tags with encrypted hashes and replace <enc> with <dec>
function encryptAndReplace(data, isEnc, passkey) {
  const stag = isEnc ? "<enc>" : "**encrypted**<!--<dec>";
  const etag = isEnc ? "</enc>" : "</dec>-->";

  const stag_res = !isEnc ? "<enc>" : "**encrypted**<!--<dec>";
  const etag_res = !isEnc ? "</enc>" : "</dec>-->";

  const slen = stag.length;
  const elen = etag.length;
  let newData = "";
  let dataIndex = 0;
  let tag_found = false;
  while (dataIndex < data.length) {
    const encStartIndex = data.indexOf(stag, dataIndex);
    tag_found = tag_found | (encStartIndex > -1);
    if (encStartIndex === -1) {
      // No more <enc> tags found
      newData += data.slice(dataIndex);
      break;
    }

    const encEndIndex = data.indexOf(etag, encStartIndex);
    if (encEndIndex === -1) {
      // <enc> tag not properly closed
      throw new Error("Invalid input format: unclosed <enc> tag.");
    }
    // Extract code between <enc> tags
    const text = data.slice(encStartIndex + slen, encEndIndex);

    const result = isEnc ? encrypt(text, passkey) : decrypt(text, passkey);
    // Replace <enc> with <dec> or <enc> with <dec> and append encrypted hash
    newData +=
      data.slice(dataIndex, encStartIndex) + stag_res + result + etag_res;

    // Move dataIndex to the position after the </enc> tag
    dataIndex = encEndIndex + elen;
  }

  return { tag_found: tag_found, content: newData };
}
// Function to encrypt text using AES-256-GCM and encode in Base64
function encrypt(text, passkey) {
  // Generate a 32-byte key using PBKDF2
  const key = crypto.pbkdf2Sync(passkey, "salt", 100000, 32, "sha256");

  // Generate a random IV
  const iv = crypto.randomBytes(12);

  // Create a cipher object using GCM mode
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  // Encrypt the text
  let encrypted = cipher.update(text, "utf-8", "base64");
  encrypted += cipher.final("base64");

  // Get the authentication tag
  const authTag = cipher.getAuthTag();

  // Combine the IV, authTag, and encrypted text
  const encryptedData = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "base64"),
  ]);

  // Return the encrypted data in Base64 format
  return encryptedData.toString("base64");
}

// Function to decrypt Base64-encoded data and return the original text
function decrypt(encryptedData, passkey) {
  // Generate a 32-byte key using PBKDF2
  const key = crypto.pbkdf2Sync(passkey, "salt", 100000, 32, "sha256");

  // Decode the Base64-encoded data
  const encryptedBuffer = Buffer.from(encryptedData, "base64");

  // Extract the IV, authTag, and encrypted text
  const iv = encryptedBuffer.subarray(0, 12);
  const authTag = encryptedBuffer.subarray(12, 28);
  const encryptedText = encryptedBuffer.subarray(28);

  // Create a decipher object using GCM mode
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  // Set the authentication tag
  decipher.setAuthTag(authTag);

  // Decrypt the text
  let decrypted = decipher.update(encryptedText, "base64", "utf-8");
  try {
    decrypted += decipher.final("utf-8");
  } catch (err) {
    console.error("potentially bad passkey.");
    process.exit(1);
  }

  // Return the decrypted text
  return decrypted;
}
module.exports = { encryptAndReplace, encrypt, decrypt };
