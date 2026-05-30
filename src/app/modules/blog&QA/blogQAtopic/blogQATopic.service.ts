import httpStatus from "http-status";

import { TBlogQATopic } from "./blogQATopic.interface";
import { BlogQATopic } from "./blogQATopic.model";
import ApiError from "../../../errorHandlers/ApiError";

const createBlogQATopic = async (payload: TBlogQATopic) => {
  const existing = await BlogQATopic.findOne({ slug: payload.slug });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A topic with this slug already exists"
    );
  }

  const result = await BlogQATopic.create(payload);
  return result;
};

const getAllBlogQATopics = async (query: Record<string, unknown>) => {
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
    BlogQATopic.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    BlogQATopic.countDocuments(filter),
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

const getBlogQATopicById = async (id: string) => {
  const result = await BlogQATopic.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog QA topic not found");
  }
  return result;
};

const getBlogQATopicBySlug = async (slug: string) => {
  const result = await BlogQATopic.findOne({ slug });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog QA topic not found");
  }
  return result;
};

const updateBlogQATopic = async (
  id: string,
  payload: Partial<TBlogQATopic>
) => {
  const existing = await BlogQATopic.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog QA topic not found");
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const slugTaken = await BlogQATopic.findOne({ slug: payload.slug });
    if (slugTaken) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "A topic with this slug already exists"
      );
    }
  }

  const result = await BlogQATopic.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  );

  return result;
};

const deleteBlogQATopic = async (id: string) => {
  const existing = await BlogQATopic.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog QA topic not found");
  }

  await BlogQATopic.findByIdAndDelete(id);
  return null;
};

export const BlogQATopicService = {
  createBlogQATopic,
  getAllBlogQATopics,
  getBlogQATopicById,
  getBlogQATopicBySlug,
  updateBlogQATopic,
  deleteBlogQATopic,
};
