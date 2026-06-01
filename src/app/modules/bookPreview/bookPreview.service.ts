import { Types } from "mongoose";
import config from "../../config/config";
import { QueryHelper } from "../../helper/query.helper";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "../../config/r2.config";
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
      const baseUrl = config.r2?.publicDomain || config.image_base_url;
      result.src = baseUrl + "/" + result.src;
    }
    return result;
  } else {
    return {};
  }
};

const getAllBookPreviewsFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.previewType) {
    filter.previewType = query.previewType;
  }
  const previewQuery = new QueryHelper<TBookPreview>(
    BookPreviewModel.find(filter),
    query
  )
    .search(["alt"])
    .sort()
    .paginate();
  const data: TBookPreview[] =
    (await previewQuery.model.lean()) as unknown as TBookPreview[];
  const meta = await previewQuery.metaData();
  const baseUrl = config.r2?.publicDomain || config.image_base_url;
  const formattedData = data.map((item: TBookPreview) => ({
    ...item,
    src: baseUrl + "/" + item.src,
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

export const BookPreviewServices = {
  createBookPreviewIntoDB,
  getABookPreviewFromDB,
  getAllBookPreviewsFromDB,
  deleteBookPreviewsFromDB,
};
