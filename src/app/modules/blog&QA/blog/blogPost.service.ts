/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import { TBlogPost } from "./blogPost.interface";
import { BlogPost } from "./blogPost.model";
import SeoModel from "../../seo/seo.model";

const createOrAttachSeo = async (payload: any) => {
  if (payload && Object.prototype.hasOwnProperty.call(payload, "seo")) {
    const val = payload.seo;
    if (val && typeof val === "object" && Object.keys(val).length > 0) {
      const [seoDoc] = await SeoModel.create([val]);
      payload.seo = seoDoc._id;
    } else {
      delete payload.seo;
    }
  }
};

const updateOrAttachSeo = async (existing: any, payload: any) => {
  if (payload && Object.prototype.hasOwnProperty.call(payload, "seo")) {
    const val = payload.seo;
    if (val && typeof val === "object" && Object.keys(val).length > 0) {
      if (existing.seo) {
        await SeoModel.findByIdAndUpdate(existing.seo, { $set: val });
        delete payload.seo;
      } else {
        const [seoDoc] = await SeoModel.create([val]);
        payload.seo = seoDoc._id;
      }
    } else {
      delete payload.seo;
    }
  }
};

const createBlogPost = async (payload: TBlogPost) => {
  const existing = await BlogPost.findOne({ slug: payload.slug });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A blog post with this slug already exists"
    );
  }

  // Auto set publishedAt when status is published
  if (payload.status === "published" && !payload.publishedAt) {
    payload.publishedAt = new Date();
  }

  // attach or create seo document
  await createOrAttachSeo(payload);

  const result = await BlogPost.create(payload);
  return result;
};

const getAllBlogPosts = async (query: Record<string, unknown>) => {
  const {
    status,
    postType,
    category,
    author,
    tags,
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (postType) filter.postType = postType;
  if (category) filter.category = category;
  if (author) filter.author = author;
  if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: Record<string, 1 | -1> = {
    [sortBy as string]: sortOrder === "asc" ? 1 : -1,
  };

  const [data, total] = await Promise.all([
    BlogPost.find(filter)
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .populate("author", "name email")
      .populate("featuredImage", "src alt")
      .populate("relatedBlogs", "title slug")
      .skip(skip)
      .limit(Number(limit))
      .sort(sort),
    BlogPost.countDocuments(filter),
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

const getBlogPostById = async (id: string) => {
  const result = await BlogPost.findById(id)
    .populate("category", "name slug")
    .populate("tags", "name slug")
    .populate("author", "name email")
    .populate("featuredImage", "src alt")
    .populate("relatedBlogs", "title slug featuredImage excerpt");

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog post not found");
  }

  return result;
};

const getBlogPostBySlug = async (slug: string) => {
  const result = await BlogPost.findOne({ slug })
    .populate("category", "name slug")
    .populate("tags", "name slug")
    .populate("author", "name email")
    .populate("featuredImage", "src alt")
    .populate("relatedBlogs", "title slug featuredImage excerpt");

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog post not found");
  }

  return result;
};

const incrementBlogPostViews = async (id: string) => {
  const result = await BlogPost.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog post not found");
  }

  return result;
};

const updateBlogPost = async (id: string, payload: Partial<TBlogPost>) => {
  const existing = await BlogPost.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog post not found");
  }

  // Check slug uniqueness if slug is being updated
  if (payload.slug && payload.slug !== existing.slug) {
    const slugTaken = await BlogPost.findOne({ slug: payload.slug });
    if (slugTaken) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "A blog post with this slug already exists"
      );
    }
  }

  // Auto set publishedAt when status changes to published
  if (
    payload.status === "published" &&
    !existing.publishedAt &&
    !payload.publishedAt
  ) {
    payload.publishedAt = new Date();
  }

  // attach or update seo document
  await updateOrAttachSeo(existing as any, payload as any);

  const result = await BlogPost.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("category", "name slug")
    .populate("tags", "name slug")
    .populate("author", "name email");

  return result;
};

const deleteBlogPost = async (id: string) => {
  const existing = await BlogPost.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog post not found");
  }

  await BlogPost.findByIdAndDelete(id);
  return null;
};

export const BlogPostService = {
  createBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  incrementBlogPostViews,
  updateBlogPost,
  deleteBlogPost,
};
