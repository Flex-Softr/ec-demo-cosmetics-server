import { Types } from "mongoose";
import config from "../../config/config";
import { QueryHelper } from "../../helper/query.helper";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "../../config/r2.config";
import { TImage } from "./image.interface";
import { ImageModel } from "./image.model";

const createImageIntoDB = async (payload: Partial<TImage[]>) => {
  const result = await ImageModel.create(payload);
  return result;
};

const getAnImageFromDB = async (id: string) => {
  if (id != "undefined") {
    const result = await ImageModel.findById(id, "_id src alt").lean();
    if (result) {
      const baseUrl = config.r2?.publicDomain || config.image_base_url;
      result.src = baseUrl + "/" + result.src;
    }
    return result;
  } else {
    return {};
  }
};

const getAllImagesFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.purpose) {
    if (query.purpose === "product" || query.purpose === "blog") {
      filter.purpose = { $in: [query.purpose, "general"] };
    } else {
      filter.purpose = query.purpose;
    }
  }
  const imageQuery = new QueryHelper<TImage>(ImageModel.find(filter), query)
    .sort()
    .paginate();
  const data: TImage[] = (await imageQuery.model.lean()) as unknown as TImage[];
  const meta = await imageQuery.metaData();
  const baseUrl = config.r2?.publicDomain || config.image_base_url;
  const formattedData = data.map((img: TImage) => ({
    ...img,
    src: baseUrl + "/" + img.src,
  }));
  return { meta, data: formattedData };
};

const deleteImagesFromDB = async (
  deletedBy: Types.ObjectId,
  imageIds: string[]
) => {
  if (imageIds.length) {
    imageIds.forEach(async (id) => {
      const result = await ImageModel.findByIdAndUpdate(id, {
        deletedBy,
        isDeleted: true,
      });
      if (result) {
        try {
          const command = new DeleteObjectCommand({
            Bucket: config.r2.bucketName,
            Key: result.src,
          });
          await r2Client.send(command);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to delete object from R2:", error);
        }
      }
    });
  }
};

export const ImageServices = {
  createImageIntoDB,
  getAnImageFromDB,
  getAllImagesFromDB,
  deleteImagesFromDB,
};
