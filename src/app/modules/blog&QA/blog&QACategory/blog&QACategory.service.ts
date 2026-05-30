import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import { TBlogQAcategory } from "./blog&QACategory.interface";
import { BlogQAcategory } from "./blog&QACategory.model";

const createBlogQAcategory = async (payload: TBlogQAcategory) => {
  const existing = await BlogQAcategory.findOne({ slug: payload.slug });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A category with this slug already exists"
    );
  }

  const result = await BlogQAcategory.create(payload);
  return result;
};

const getAllBlogQAcategories = async (query: Record<string, unknown>) => {
  const { status, page = 1, limit = 10, search } = query;

  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    BlogQAcategory.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    BlogQAcategory.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

const getBlogQAcategoryById = async (id: string) => {
  const result = await BlogQAcategory.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog category not found");
  }
  return result;
};

const getBlogQAcategoryBySlug = async (slug: string) => {
  const result = await BlogQAcategory.findOne({ slug });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog category not found");
  }
  return result;
};

const updateBlogQAcategory = async (
  id: string,
  payload: Partial<TBlogQAcategory>
) => {
  const existing = await BlogQAcategory.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog category not found");
  }

  // Check slug uniqueness if slug is being updated
  if (payload.slug && payload.slug !== existing.slug) {
    const slugTaken = await BlogQAcategory.findOne({ slug: payload.slug });
    if (slugTaken) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "A category with this slug already exists"
      );
    }
  }

  const result = await BlogQAcategory.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  );

  return result;
};

const deleteBlogQAcategory = async (id: string) => {
  const existing = await BlogQAcategory.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog category not found");
  }

  await BlogQAcategory.findByIdAndDelete(id);
  return null;
};

export const BlogQAcategoryService = {
  createBlogQAcategory,
  getAllBlogQAcategories,
  getBlogQAcategoryById,
  getBlogQAcategoryBySlug,
  updateBlogQAcategory,
  deleteBlogQAcategory,
};
