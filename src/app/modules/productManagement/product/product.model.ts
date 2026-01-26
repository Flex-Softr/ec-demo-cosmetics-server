import { Schema, model } from "mongoose";
import {
  TCategorySchema,
  TProduct,
  TProductAttribute,
  TProductImage,
  TSeoData,
  TTag,
  TWarrantyInfo,
} from "./product.interface";
// import { TAttribute } from "../attribute/attribute.interface";
import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import { ImageModel } from "../../image/image.model";
import { AttributeModel } from "../attribute/attribute.model";
import { BrandModel } from "../brand/brand.model";
import { CategoryModel } from "../category/category.model";
import { SubCategoryModel } from "../subCategory/subCategory.model";
import { PRODUCT_STATUS, PRODUCT_TYPE } from "./product.const";

const productImageSchema = new Schema<TProductImage>(
  {
    thumbnail: { type: Schema.Types.ObjectId, required: true, ref: "Image" },
    gallery: {
      type: [{ type: Schema.Types.ObjectId, required: true, ref: "Image" }],
      required: true,
    },
  },
  { _id: false }
);

const productAttributeSchema = new Schema<TProductAttribute>(
  {
    name: { type: Schema.Types.ObjectId, ref: "Attribute" },
    values: { type: [Schema.Types.ObjectId] },
  },
  { _id: false }
);

const categorySchema = new Schema<TCategorySchema>(
  {
    name: { type: Schema.Types.ObjectId, required: true, ref: "Category" },
    subCategory: { type: Schema.Types.ObjectId, ref: "SubCategory" },
  },
  { _id: false }
);

const warrantyInfoSchema = new Schema<TWarrantyInfo>(
  {
    duration: {
      quantity: { type: String },
      unit: { type: String },
    },
    terms: { type: String },
  },
  { _id: false }
);

const seoDataSchema = new Schema<TSeoData>(
  {
    focusKeyphrase: { type: String },
    metaTitle: { type: String },
    slug: { type: String },
    metaDescription: { type: String },
  },
  { _id: false }
);

const tagSchema = new Schema<TTag>(
  {
    label: { type: String },
    value: { type: String },
  },
  { _id: false }
);

export const productSchema = new Schema<TProduct>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    // permalink: { type: String, unique: true, sparse: true },
    type: {
      type: String,
      enum: [PRODUCT_TYPE.SIMPLE, PRODUCT_TYPE.VARIABLE],
      default: PRODUCT_TYPE.SIMPLE,
    },
    description: { type: String },
    shortDescription: { type: String },
    additionalInfo: { type: String },
    // usageGuidelines: { type: String },
    // downloadable: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    // review: { type: Boolean, default: false },
    price: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.type === PRODUCT_TYPE.SIMPLE;
      },
      ref: "Price",
    },
    image: {
      type: productImageSchema,
      required: true,
    },
    inventory: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.type === PRODUCT_TYPE.SIMPLE;
      },
      ref: "Inventory",
    },
    attributes: {
      type: [productAttributeSchema],
    },
    variations: [{ type: Schema.Types.ObjectId, ref: "Variation" }],
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },
    category: categorySchema,
    productCollection: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    warranty: { type: Boolean, default: false },
    warrantyInfo: {
      type: warrantyInfoSchema,
    },
    // offer: {
    //   flash: { type: Boolean, default: false },
    //   today: { type: Boolean, default: false },
    //   featured: { type: Boolean, default: false },
    // },
    tag: [tagSchema],
    seoData: seoDataSchema,
    publishedStatus: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", async function (next) {
  const product = this as unknown as TProduct;
  const { thumbnail, gallery } = product.image;
  const { name, subCategory } = product.category;

  const isThumbnailExist = await ImageModel.findById(thumbnail);
  if (!isThumbnailExist) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "The thumbnail image was not found!"
    );
  }
  if (isThumbnailExist.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The thumbnail image is deleted!"
    );
  }

  for (const id of gallery) {
    const isGalleryExist = await ImageModel.findById(id);
    if (!isGalleryExist) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "One gallery image was not found!"
      );
    }
    if (isGalleryExist.isDeleted) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "One gallery image is deleted!"
      );
    }
  }

  const isCategoryExist = await CategoryModel.findById(name);
  if (!isCategoryExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The category was not found!");
  }
  if (isCategoryExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The category is deleted!");
  }

  if (subCategory) {
    const isSubCategoryExist = await SubCategoryModel.findById(subCategory);
    if (!isSubCategoryExist) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "The sub category was not found!"
      );
    }
    if (isSubCategoryExist.isDeleted) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "The sub category is deleted!"
      );
    }
  }

  if (product.brand) {
    const isBrandExist = await BrandModel.findById(product.brand);
    if (!isBrandExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "The brand was not found!");
    }
    if (isBrandExist.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, "The brand is deleted!");
    }
  }

  if (product.attributes) {
    for (const { name, values } of product.attributes) {
      const isAttributeExist = await AttributeModel.findById(name);
      if (!isAttributeExist) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "One attribute was not found!"
        );
      }

      if (isAttributeExist.isDeleted) {
        throw new ApiError(httpStatus.BAD_REQUEST, "One attribute is deleted!");
      }

      for (const id of values) {
        const objectId = id.toString();
        const isAttributeValueExist = isAttributeExist.values.find(
          ({ _id }) => _id?.toString() === objectId
        );

        if (!isAttributeValueExist) {
          throw new ApiError(
            httpStatus.NOT_FOUND,
            "One attribute value was not found!"
          );
        }

        if (isAttributeValueExist.isDeleted) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "One attribute value is deleted!"
          );
        }
      }
    }
  }

  next();
});

const ProductModel = model<TProduct>("Product", productSchema);

export default ProductModel;
