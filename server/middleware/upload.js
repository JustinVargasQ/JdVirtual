const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');

/* Allowed MIME types — both extension AND mime must match */
const ALLOWED = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
};

/* Known magic bytes for each type */
const MAGIC = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
];

function matchesMagic(buffer, mime) {
  const entry = MAGIC.find((m) => m.mime === mime);
  if (!entry) return false;
  return entry.bytes.every((b, i) => buffer[i] === b);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    // Random hex name — no user-controlled input in filename
    const rand = crypto.randomBytes(16).toString('hex');
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${rand}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext      = path.extname(file.originalname).toLowerCase();
  const mimeOk   = ALLOWED[ext];

  // Extension must be in allowed list AND reported MIME must match
  if (!mimeOk || file.mimetype !== mimeOk) {
    return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB
    files: 10,                   // max 10 archivos por request
  },
});

/* Middleware adicional: verificar magic bytes del archivo ya guardado */
upload.verifyMagicBytes = async (req, res, next) => {
  if (!req.files?.length && !req.file) return next();

  const fs = require('fs').promises;
  const filesToCheck = req.files || (req.file ? [req.file] : []);

  for (const f of filesToCheck) {
    try {
      const fd = await fs.open(f.path, 'r');
      const buf = Buffer.alloc(8);
      await fd.read(buf, 0, 8, 0);
      await fd.close();

      if (!matchesMagic(buf, f.mimetype)) {
        // Delete the file and reject
        await fs.unlink(f.path).catch(() => {});
        return res.status(400).json({ error: 'El archivo no es una imagen válida.' });
      }
    } catch {
      return res.status(500).json({ error: 'Error al verificar el archivo.' });
    }
  }
  next();
};

module.exports = upload;
