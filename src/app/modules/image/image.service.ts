import fsEx from "fs-extra";
import { Types } from "mongoose";
import path from "path";
import config from "../../config/config";
import { QueryHelper } from "../../helper/query.helper";
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
      result.src = config.image_base_url + "/" + result.src;
    }
    return result;
  } else {
    return {};
  }
};

const getAllImagesFromDB = async (query: Record<string, unknown>) => {
  const imageQuery = new QueryHelper<TImage>(
    ImageModel.find({ isDeleted: false }),
    query
  )
    .sort()
    .paginate();
  const data: TImage[] = (await imageQuery.model.lean()) as unknown as TImage[];
  const meta = await imageQuery.metaData();
  const formattedData = data.map((img: TImage) => ({
    ...img,
    src: config.image_base_url + "/" + img.src,
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
        const folderPath = path.parse(result.src).dir;
        fsEx.remove(folderPath);
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
