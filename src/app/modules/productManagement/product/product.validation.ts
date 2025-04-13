import { z } from "zod";
import { PriceValidation } from "../price/price.validation";
import { ProductImageValidation } from "../productImage/productImage.validation";
import { InventoryValidation } from "../inventory/inventory.validation";
// import { SeoDataValidation } from "../seoData/seoData.validation";
import { publishedStatus, visibilityStatus } from "./product.const";
import { productVariations } from "../variation/variation.validation";

const updateProductAttribute = z.object({
  name: z.string().trim().min(1, { message: "Attribute is required!" }),
  values: z
    .array(z.string().trim())
    .min(1, { message: "Attribute value is required!" }),
});

const category = z.object({
  name: z.string().min(1, { message: "Category is required!" }),
  subCategory: z.string().optional(),
});

const updateCategory = z.object({
  name: z.string().optional(),
  subCategory: z.string().optional(),
});

const warrantyInfo = z.object({
  duration: z
    .object({
      quantity: z.string().trim().optional(),
      unit: z.string().optional(),
    })
    .optional(),
  terms: z.string().optional(),
});

const publishedStatusSchema = z.object({
  status: z.enum([...publishedStatus] as [string, ...string[]]),
  visibility: z.enum([...visibilityStatus] as [string, ...string[]]),
  // date: z.string().min(1, { message: "Date is required!" }),
});

const updatePublishedStatus = z
  .object({
    status: z.enum([...publishedStatus] as [string, ...string[]]).optional(),
    visibility: z
      .enum([...visibilityStatus] as [string, ...string[]])
      .optional(),
    date: z.string().min(1, { message: "Date is required!" }).optional(),
  })
  .optional();

const product = z.object({
  body: z
    .object({
      title: z.string().trim().min(1, { message: "Title is required!" }),
      // permalink: z.string().optional(),
      // type: z.string().optional(),
      // slug: z.string().optional(),
      description: z.string().trim().optional(),
      shortDescription: z.string().optional(),
      additionalInfo: z.string().optional(),
      usageGuidelines: z.string().optional(),
      // downloadable: z.boolean().optional(),
      // review: z.boolean().optional(),
      image: ProductImageValidation.productImage,
      price: PriceValidation.price,
      inventory: InventoryValidation.inventory,
      attributes: z.array(updateProductAttribute).optional(),
      variations: z.array(productVariations).optional(),
      brand: z.string().optional(),
      category: category,
      featured: z.boolean().optional(),
      warranty: z.boolean().optional(),
      warrantyInfo: warrantyInfo.optional(),
      // tag: z.array(z.string()).optional(),
      // seoData: SeoDataValidation.updatesSeoData.optional(),
      publishedStatus: publishedStatusSchema,
    })
    .refine(
      (data) => {
        if (data.warranty) {
          return data.warrantyInfo?.duration?.quantity?.trim() !== "";
        }
        return true;
      },
      {
        message: "Warranty duration is required!",
        path: ["warrantyInfo", "duration"], // Error will be associated with quantity
      }
    )
    .refine(
      (data) => {
        if (data.warranty) {
          return data.warrantyInfo?.duration?.unit?.trim() !== "";
        }
        return true;
      },
      {
        message: "Warranty duration is required!",
        path: ["warrantyInfo", "duration"], // Error will be associated with unit
      }
    ),
});

const updateProduct = z.object({
  body: z.object({
    title: z.string().trim().optional(),
    permalink: z.string().optional(),
    type: z.string().optional(),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional(),
    shortDescription: z.string().trim().optional(),
    additionalInfo: z.string().trim().optional(),
    usageGuidelines: z.string().trim().optional(),
    downloadable: z.boolean().optional(),
    featured: z.boolean().optional(),
    review: z.boolean().optional(),
    price: PriceValidation.updatePrice.optional(),
    image: ProductImageValidation.updateProductImage.optional(),
    inventory: InventoryValidation.inventory.optional(),
    attributes: z.array(updateProductAttribute).optional(),
    variations: z.array(productVariations).optional(),
    brand: z.string().optional(),
    category: updateCategory.optional(),
    warranty: z.boolean().optional(),
    warrantyInfo: z
      .object({
        duration: z
          .object({
            quantity: z.string().trim().optional(),
            unit: z.string().optional(),
          })
          .optional(),
        terms: z.string().trim().optional(),
      })
      .optional(),
    // tag: z.array(z.string()).optional(),
    // seoData: SeoDataValidation.updatesSeoData.optional(),
    publishedStatus: updatePublishedStatus,
  }),
});

export const ProductValidation = {
  product,
  updateProduct,
};
