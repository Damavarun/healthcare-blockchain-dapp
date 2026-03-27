import CryptoJS from "crypto-js";

// Utility to convert a File object to a Base64 string
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Encrypt a Base64 string
export const encryptFile = (base64String, secretKey) => {
  return CryptoJS.AES.encrypt(base64String, secretKey).toString();
};

// Decrypt an encrypted string back to Base64
export const decryptFile = (encryptedString, secretKey) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedString, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
