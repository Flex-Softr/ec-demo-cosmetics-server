/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import { TBlogPost } from "./blogPost.interface";
import { BlogPost } from "./blogPost.model";
import { createOrAttachSeo, updateOrAttachSeo } from "../../seo/seo.util";
import { BlogQAcategory } from "../blog&QACategory/blog&QACategory.model";
import { BlogQATag } from "../blog&QATag/blog&QATTag.model";
import { BlogQATopic } from "../blogQAtopic/blogQATopic.model";

const createBlogPost = async (createdBy: string, payload: TBlogPost) => {
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

  const result = await BlogPost.create({ ...payload, createdBy });
  return result;
};

const getAllBlogPosts = async (query: Record<string, unknown>) => {
  const {
    status,
    category,
    topic,
    tags,
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (category) {
    // resolve slug to _id if needed
    const isId = /^[0-9a-fA-F]{24}$/.test(String(category));
    if (isId) {
      filter.category = category;
    } else {
      const cat = await BlogQAcategory.findOne({ slug: category }).select(
        "_id"
      );
      if (cat) filter.category = cat._id;
      else filter.category = null; // no match → return empty
    }
  }
  if (topic) {
    const isId = /^[0-9a-fA-F]{24}$/.test(String(topic));
    if (isId) {
      filter.topic = topic;
    } else {
      const topicDoc = await BlogQATopic.findOne({ slug: topic }).select("_id");
      if (topicDoc) filter.topic = topicDoc._id;
      else filter.topic = null; // no match → return empty
    }
  }
  if (tags) {
    const rawTags = Array.isArray(tags) ? tags : [tags];
    const areIds = rawTags.every((t) => /^[0-9a-fA-F]{24}$/.test(String(t)));
    if (areIds) {
      filter.tags = { $in: rawTags };
    } else {
      const tagDocs = await BlogQATag.find({ slug: { $in: rawTags } }).select(
        "_id"
      );
      filter.tags = { $in: tagDocs.map((t) => t._id) };
    }
  }

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
      .populate("topic", "name slug")
      .populate("tags", "name slug")
      .populate("createdBy", "name email")
      .populate("featuredImage", "src alt")
      .populate("seo")
      .populate({
        path: "relatedBlogs",
        select: "title slug featuredImage excerpt category topic",
        populate: [
          { path: "category", select: "name slug" },
          { path: "topic", select: "name slug" },
        ],
      })
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
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getBlogPostById = async (id: string) => {
  const result = await BlogPost.findById(id)
    .populate("category", "name slug")
    .populate("topic", "name slug")
    .populate("tags", "name slug")
    .populate("createdBy", "name email")
    .populate("featuredImage", "src alt")
    .populate("seo")
    .populate({
      path: "relatedBlogs",
      select: "title slug featuredImage excerpt category topic",
      populate: [
        { path: "category", select: "name slug" },
        { path: "topic", select: "name slug" },
      ],
    });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog post not found");
  }

  return result;
};

const getBlogPostBySlug = async (slug: string) => {
  const result = await BlogPost.findOne({ slug })
    .populate("category", "name slug")
    .populate("topic", "name slug")
    .populate("tags", "name slug")
    .populate("createdBy", "name email")
    .populate("featuredImage", "src alt")
    .populate({
      path: "relatedBlogs",
      select: "title slug featuredImage excerpt category topic",
      populate: [
        { path: "category", select: "name slug" },
        { path: "topic", select: "name slug" },
      ],
    })
    .populate("seo");

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
    .populate("createdBy", "name email")
    .populate("seo");

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
