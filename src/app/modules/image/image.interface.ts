import { Types } from "mongoose";

export type TImage = {
  src: string;
  alt: string;
  uploadedBy: Types.ObjectId;
  purpose?: "product" | "blog" | "general";
  isDeleted?: boolean;
};
