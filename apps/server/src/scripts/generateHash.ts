import bcrypt from 'bcryptjs';

const password = 'admin123';
const salt = bcrypt.genSaltSync(8);
const hash = bcrypt.hashSync(password, salt);

console.log('Password:', password);
console.log('Hash:', hash);
