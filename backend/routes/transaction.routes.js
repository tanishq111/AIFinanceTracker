import express from 'express';
import multer from 'multer';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadReceipt
} from '../controllers/transaction.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    console.log('Uploaded file mimetype:', file.mimetype);
    console.log('Uploaded file name:', file.originalname);
    
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Received: ${file.mimetype}. Only images (JPEG, PNG, WebP) and PDFs are allowed`));
    }
  }
});

// All routes are protected
router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

router.post('/:id/receipt', upload.single('receipt'), uploadReceipt);

export default router;
