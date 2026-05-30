import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import { TBlogQATag } from "./blog&QATag.interface";
import { BlogQATag } from "./blog&QATTag.model";

const createBlogQATag = async (payload: TBlogQATag) => {
  const existing = await BlogQATag.findOne({ slug: payload.slug });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A tag with this slug already exists"
    );
  }

  const result = await BlogQATag.create(payload);
  return result;
};

const getAllBlogQATags = async (query: Record<string, unknown>) => {
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
    BlogQATag.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    BlogQATag.countDocuments(filter),
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

const getBlogQATagById = async (id: string) => {
  const result = await BlogQATag.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog QA tag not found");
  }
  return result;
};

const getBlogQATagBySlug = async (slug: string) => {
  const result = await BlogQATag.findOne({ slug });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog QA tag not found");
  }
  return result;
};

const updateBlogQATag = async (id: string, payload: Partial<TBlogQATag>) => {
  const existing = await BlogQATag.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog QA tag not found");
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const slugTaken = await BlogQATag.findOne({ slug: payload.slug });
    if (slugTaken) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "A tag with this slug already exists"
      );
    }
  }

  const result = await BlogQATag.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  );

  return result;
};

const deleteBlogQATag = async (id: string) => {
  const existing = await BlogQATag.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog QA tag not found");
  }

  await BlogQATag.findByIdAndDelete(id);
  return null;
};

export const BlogQATagService = {
  createBlogQATag,
  getAllBlogQATags,
  getBlogQATagById,
  getBlogQATagBySlug,
  updateBlogQATag,
  deleteBlogQATag,
};
