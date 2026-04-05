import fs from "fs";
import httpStatus from "http-status";
import multer from "multer";
import path from "path";
import ApiError from "../errorHandlers/ApiError";
import config from "../config/config";

const storage = (dirName: string) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, getUploadFolder(dirName));
    },
    filename: function (req, file, cb) {
      const decodedName = Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      );
      const fileExt = path.extname(decodedName);
      const filename = decodedName
        .replace(fileExt, "")
        .toLowerCase()
        .split(" ")
        .join("-");
      cb(null, filename + fileExt);
    },
  });

const getUploadFolder = (dirName: string) => {
  // Create a unique folder name using a timestamp
  const timestamp = Date.now();
  const uploadFolder = path.join(`uploads/${dirName}`, String(timestamp));

  // Create the folder if it doesn't exist
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  return uploadFolder;
};

const pdfUploader = multer({
  storage: storage("previews"),
  limits: { fileSize: Number(config.upload_pdf_size) || 5000000 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".pdf"];
    if (!allowedExts.includes(ext)) {
      return cb(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Only ${allowedExts.join(", ")} formats are allowed`
        )
      );
    }
    cb(null, true);
  },
});

export default pdfUploader;
