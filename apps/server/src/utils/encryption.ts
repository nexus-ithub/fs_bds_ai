
import crypto from 'crypto';



const algorithm = 'aes-256-cbc';
const secret = process.env.AES_SECRET as string;
const key = crypto.scryptSync(secret, 'salt', 32); // 256bit key
const iv = crypto.randomBytes(16);



export function encrypt(text: string) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(encryptedData: string) {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}