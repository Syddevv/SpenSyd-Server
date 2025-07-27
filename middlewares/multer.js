import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isValid = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  if (isValid) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

export default multer({ storage, fileFilter });
