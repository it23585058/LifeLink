import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import Donor from '../models/donor.model.js';
import MedicalDocument from '../models/medical-document.model.js';

const router = express.Router();

const uploadDirectory = path.resolve(
  process.cwd(),
  'uploads',
  'medical-documents'
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const allowedExtensions = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
]);

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_request, file, callback) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName =
      `${Date.now()}-${crypto.randomUUID()}${extension}`;

    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_request, file, callback) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (
      allowedMimeTypes.has(file.mimetype) &&
      allowedExtensions.has(extension)
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error(
        'Only PDF, JPG, JPEG and PNG files are allowed.'
      )
    );
  },
});

router.get('/:donorId', async (request, response, next) => {
  try {
    const { donorId } = request.params;

    const donor = await Donor.findById(donorId);

    if (!donor) {
      return response.status(404).json({
        error: 'Donor not found.',
      });
    }

    const documents =
      await MedicalDocument.find({
        donor: donorId,
      }).sort({
        createdAt: -1,
      });

    return response.json(documents);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:donorId',
  upload.single('document'),
  async (request, response, next) => {
    try {
      const { donorId } = request.params;

      const donor = await Donor.findById(donorId);

      if (!donor) {
        if (request.file) {
          fs.unlinkSync(request.file.path);
        }

        return response.status(404).json({
          error: 'Donor not found.',
        });
      }

      if (!request.file) {
        return response.status(400).json({
          error: 'Please select a medical document.',
        });
      }

      const document =
        await MedicalDocument.create({
          donor: donorId,

          originalName:
            request.file.originalname,

          fileName:
            request.file.filename,

          filePath:
            request.file.path,

          mimeType:
            request.file.mimetype,

          size:
            request.file.size,
        });

      console.log(
        'MEDICAL DOCUMENT UPLOADED:',
        document._id
      );

      return response.status(201).json(document);
    } catch (error) {
      if (request.file) {
        try {
          fs.unlinkSync(request.file.path);
        } catch {
          // Ignore cleanup error.
        }
      }

      next(error);
    }
  }
);

router.delete(
  '/:donorId/:documentId',
  async (request, response, next) => {
    try {
      const {
        donorId,
        documentId,
      } = request.params;

      const document =
        await MedicalDocument.findOne({
          _id: documentId,
          donor: donorId,
        });

      if (!document) {
        return response.status(404).json({
          error: 'Medical document not found.',
        });
      }

      if (
        document.filePath &&
        fs.existsSync(document.filePath)
      ) {
        fs.unlinkSync(document.filePath);
      }

      await MedicalDocument.deleteOne({
        _id: documentId,
      });

      return response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;