import { Types } from "mongoose";

export type TBookPreview = {
  src: string;
  alt: string;
  previewType: "short" | "full" | "free";
  uploadedBy: Types.ObjectId;
  deletedBy?: Types.ObjectId;
  isDeleted: boolean;
};
