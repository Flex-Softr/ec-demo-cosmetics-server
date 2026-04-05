import { Types } from "mongoose";

export type TBookPreview = {
  src: string;
  alt: string;
  uploadedBy: Types.ObjectId;
  deletedBy?: Types.ObjectId;
  isDeleted: boolean;
};
