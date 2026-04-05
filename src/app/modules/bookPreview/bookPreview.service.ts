import fsEx from "fs-extra";
import { Types } from "mongoose";
import path from "path";
import config from "../../config/config";
import { QueryHelper } from "../../helper/query.helper";
import { TBookPreview } from "./bookPreview.interface";
import { BookPreviewModel } from "./bookPreview.model";

const createBookPreviewIntoDB = async (payload: Partial<TBookPreview[]>) => {
  const result = await BookPreviewModel.create(payload);
  return result;
};

const getABookPreviewFromDB = async (id: string) => {
  if (id != "undefined") {
    const result = await BookPreviewModel.findById(id, "_id src alt").lean();
    if (result) {
      result.src = config.image_base_url + "/" + result.src;
    }
    return result;
  } else {
    return {};
  }
};

const getAllBookPreviewsFromDB = async (query: Record<string, unknown>) => {
  const previewQuery = new QueryHelper<TBookPreview>(
    BookPreviewModel.find({ isDeleted: false }),
    query
  )
    .search(["alt"])
    .sort()
    .paginate();
  const data: TBookPreview[] =
    (await previewQuery.model.lean()) as unknown as TBookPreview[];
  const meta = await previewQuery.metaData();
  const formattedData = data.map((item: TBookPreview) => ({
    ...item,
    src: config.image_base_url + "/" + item.src,
  }));
  return { meta, data: formattedData };
};

const deleteBookPreviewsFromDB = async (
  deletedBy: Types.ObjectId,
  previewIds: string[]
) => {
  if (previewIds.length) {
    previewIds.forEach(async (id) => {
      const result = await BookPreviewModel.findByIdAndUpdate(id, {
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

export const BookPreviewServices = {
  createBookPreviewIntoDB,
  getABookPreviewFromDB,
  getAllBookPreviewsFromDB,
  deleteBookPreviewsFromDB,
};
