/**
 * Script ONE-SHOT para cambiar la contraseña del admin.
 * Uso:  node scripts/change-admin-password.js <nueva-contraseña>
 * Borrá este archivo después de ejecutarlo.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const readline  = require('readline');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌ MONGO_URI no configurado en .env'); process.exit(1); }

async function changePassword(newPassword) {
  if (!newPassword || newPassword.length < 12) {
    console.error('❌ La contraseña debe tener al menos 12 caracteres.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB conectado');

  const Admin = require('../models/Admin');
  const admin = await Admin.findOne({});

  if (!admin) {
    console.error('❌ No se encontró ningún admin en la base de datos.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await Admin.updateOne({ _id: admin._id }, { passwordHash: hash });

  console.log(`✅ Contraseña actualizada para: ${admin.email}`);
  console.log('🗑️  Podés borrar este script ahora: server/scripts/change-admin-password.js');
  await mongoose.disconnect();
}

/* Acepta contraseña como argumento o la pide interactivamente */
const argPassword = process.argv[2];

if (argPassword) {
  changePassword(argPassword).catch((e) => { console.error(e); process.exit(1); });
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('🔐 Nueva contraseña (mín 12 chars): ', (pwd) => {
    rl.close();
    changePassword(pwd.trim()).catch((e) => { console.error(e); process.exit(1); });
  });
}
