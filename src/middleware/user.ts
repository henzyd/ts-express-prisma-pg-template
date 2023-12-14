import multer from "multer";
import path from "path";

const destination = path.join(__dirname, "../public/profiles");

const upload = multer({
  storage: multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
      return cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
});

export { upload };
