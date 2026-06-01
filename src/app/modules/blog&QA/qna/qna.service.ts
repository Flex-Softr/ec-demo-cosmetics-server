import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import { TQnA } from "./qna.interface";
import { QnA } from "./qna.model";
import { createOrAttachSeo, updateOrAttachSeo } from "../../seo/seo.util";
import { BlogQAcategory } from "../blog&QACategory/blog&QACategory.model";
import { BlogQATag } from "../blog&QATag/blog&QATTag.model";

const createQnA = async (payload: TQnA) => {
  const existing = await QnA.findOne({ slug: payload.slug });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A Q&A with this slug already exists"
    );
  }

  // attach or create seo doc
  await createOrAttachSeo(payload);

  const result = await QnA.create(payload);
  return result;
};

const getAllQnAs = async (query: Record<string, unknown>) => {
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
    const isId = /^[0-9a-fA-F]{24}$/.test(String(category));
    if (isId) {
      filter.category = category;
    } else {
      const cat = await BlogQAcategory.findOne({ slug: category }).select(
        "_id"
      );
      if (cat) filter.category = cat._id;
      else filter.category = null;
    }
  }
  if (topic) filter.topic = topic;
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
      { question: { $regex: search, $options: "i" } },
      { answer: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort: Record<string, 1 | -1> = {
    [sortBy as string]: sortOrder === "asc" ? 1 : -1,
  };

  const [data, total] = await Promise.all([
    QnA.find(filter)
      .populate("category", "name slug")
      .populate("topic", "name slug")
      .populate("tags", "name slug")
      .populate("createdBy", "name email")
      .populate({
        path: "relatedQuestions",
        select: "question slug topic",
        populate: { path: "topic", select: "name slug" },
      })
      .populate("seo")
      .skip(skip)
      .limit(Number(limit))
      .sort(sort),
    QnA.countDocuments(filter),
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

const getQnAById = async (id: string) => {
  const result = await QnA.findById(id)
    .populate("category", "name slug")
    .populate("topic", "name slug")
    .populate("tags", "name slug")
    .populate("createdBy", "name email")
    .populate({
      path: "relatedQuestions",
      select: "question slug topic",
      populate: { path: "topic", select: "name slug" },
    })
    .populate("seo");

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Q&A not found");
  }

  return result;
};

const getQnABySlug = async (slug: string) => {
  const result = await QnA.findOne({ slug })
    .populate("category", "name slug")
    .populate("topic", "name slug")
    .populate("tags", "name slug")
    .populate("createdBy", "name email")
    .populate({
      path: "relatedQuestions",
      select: "question slug topic",
      populate: { path: "topic", select: "name slug" },
    })
    .populate("seo");

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Q&A not found");
  }

  return result;
};

const incrementQnAViews = async (id: string) => {
  const result = await QnA.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Q&A not found");
  }

  return result;
};

const updateQnA = async (id: string, payload: Partial<TQnA>) => {
  const existing = await QnA.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Q&A not found");
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const slugTaken = await QnA.findOne({ slug: payload.slug });
    if (slugTaken) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "A Q&A with this slug already exists"
      );
    }
  }

  // attach or update seo doc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateOrAttachSeo(existing as any, payload as any);

  const result = await QnA.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("category", "name slug")
    .populate("topic", "name slug")
    .populate("tags", "name slug")
    .populate("createdBy", "name email")
    .populate("seo");

  return result;
};

const deleteQnA = async (id: string) => {
  const existing = await QnA.findById(id);
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Q&A not found");
  }

  await QnA.findByIdAndDelete(id);
  return null;
};

export const QnAService = {
  createQnA,
  getAllQnAs,
  getQnAById,
  getQnABySlug,
  incrementQnAViews,
  updateQnA,
  deleteQnA,
};
