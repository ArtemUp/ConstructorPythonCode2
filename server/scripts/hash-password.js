const bcrypt = require('bcrypt');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "ваш-пароль"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nВставьте это в .env → ADMIN_PASSWORD_HASH:\n');
console.log(hash);