import httpStatus from "http-status";
import ApiError from "../../errorHandlers/ApiError";
import { TCollection } from "../productManagement/collection/collection.interface";
import { ProductServices } from "../productManagement/product/product.service";
import { THomePageInput } from "./homepageSection.interface";
import { HomepageSectionModel } from "./homepageSection.model";

const createHomepageSection = async (payload: THomePageInput) => {
  const result = await HomepageSectionModel.create(payload);
  return result;
};

const getAllHomepageSections = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};
  if (query.isActive) {
    filter.isActive = query.isActive === "true";
  }

  const result = await HomepageSectionModel.find(filter)
    .populate("collectionId")
    .sort({ sortOrder: 1, updatedAt: -1 });
  return result;
};

const getHomepageSectionById = async (id: string) => {
  const result =
    await HomepageSectionModel.findById(id).populate("collectionId");
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Homepage Section not found!");
  }
  return result;
};

const updateHomepageSection = async (
  id: string,
  payload: Partial<THomePageInput>
) => {
  const result = await HomepageSectionModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Homepage Section not found!");
  }

  return result;
};

const deleteHomepageSection = async (id: string) => {
  const result = await HomepageSectionModel.findByIdAndDelete(id);

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Homepage Section not found!");
  }

  return result;
};

const getHomepageSectionContent = async (id: string) => {
  const result =
    await HomepageSectionModel.findById(id).populate("collectionId");

  if (!result?.collectionId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { meta: {} as any, data: [] };
  }

  const products = await ProductServices.getAllProductsCustomerFromDB({
    collection: (result?.collectionId as TCollection)?.slug,
    limit: result?.limit,
    sort: "-updatedAt",
  });
  return products;
};

export const HomepageSectionService = {
  createHomepageSection,
  getAllHomepageSections,
  getHomepageSectionById,
  updateHomepageSection,
  deleteHomepageSection,
  getHomepageSectionContent,
};
