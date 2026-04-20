import fs from "fs";
import httpStatus from "http-status";
import multer from "multer";
import path from "path";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";

const storage = (dirName: string) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      const folder = getUploadFolder(dirName);
      // Attach the folder path to the request object so it can be cleaned up on error
      // using a Set to handle multiple files in the same request
      if (!req.uploadedFolders) {
        req.uploadedFolders = new Set<string>();
      }
      req.uploadedFolders.add(folder);

      cb(null, folder);
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
      // +  "-" + Date.now();
      cb(null, filename + fileExt);
    },
  });

const getUploadFolder = (dirName: string) => {
  // Create a unique folder name using a timestamp
  const timestamp = Date.now();
  const uploadFolder = path.join(`uploads/${dirName}`, String(timestamp));
  // const uploadFolder = process.cwd() + "/uploads/public/" + String(timestamp);

  // Create the folder if it doesn't exist
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  return uploadFolder;
};

const imgUploader = multer({
  storage: storage("public"),
  limits: { fileSize: Number(config.upload_image_size) }, // 1MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = JSON.parse(config.upload_image_format as string);
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

export const ImageToOrderImgUploader = multer({
  storage: storage("image_to_order"),
  limits: { fileSize: Number(config.upload_image_size) }, // 1MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = JSON.parse(config.upload_image_format as string);
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

export const imageAndVideoUploader = multer({
  storage: storage("warranty_claim"),
  limits: { fileSize: Number(config.upload_video_size) },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname);
    const allowedExts = [
      ...JSON.parse(config.upload_image_format as string),
      ".mp4",
      ".mov",
      ".avi",
    ];
    if (!allowedExts.includes(ext)) {
      return cb(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Only ${allowedExts} format is allowed`
        )
      );
    }
    cb(null, true);
  },
});

export const employPhotoUploader = multer({
  storage: storage("employ"),
  limits: { fileSize: 500 * 1024 }, // 500kb
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname);
    const allowedExts = JSON.parse(config.upload_image_format as string);
    if (!allowedExts.includes(ext)) {
      return cb(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Only ${allowedExts} format is allowed`
        )
      );
    }
    cb(null, true);
  },
});

export default imgUploader;
