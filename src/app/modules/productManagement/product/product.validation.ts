import { z } from "zod";
import { InventoryValidation } from "../inventory/inventory.validation";
import { productSeoValidationSchema } from "../../seo/seo.validation";
import { PRODUCT_STATUS, PRODUCT_TYPE } from "./product.const";

const createProductAttribute = z.object({
  name: z.string().trim().min(1, { message: "Attribute name is required!" }),
  values: z
    .array(z.string().trim())
    .min(1, { message: "Attribute values are required!" }),
});

const warrantyInfo = z.object({
  duration: z.object({
    quantity: z.string().trim().optional(),
    unit: z.string().optional(),
  }),
  terms: z.string().optional(),
});

const publishedStatusSchema = z.enum([...Object.values(PRODUCT_STATUS)] as [
  string,
  ...string[],
]);

const priceSchema = z.object({
  regularPrice: z.number().min(0),
  salePrice: z.number().optional(),
  discountPercent: z.number().optional(),
  priceSave: z.number().optional(),
  date: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
});

const imageSchema = z.object({
  thumbnail: z.string().min(1, "Thumbnail is required"),
  gallery: z.array(z.string()).min(1, "At least one gallery image is required"),
});

const variationSchema = z.object({
  attributes: z.record(z.string(), z.string()),
  price: priceSchema,
  inventory: InventoryValidation.inventorySchema,
  offer: z
    .object({
      flash: z.boolean().optional(),
      today: z.boolean().optional(),
      featured: z.boolean().optional(),
    })
    .optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

const product = z.object({
  body: z
    .object({
      title: z.string().trim().min(1, { message: "Title is required!" }),
      slug: z.string().trim().optional(),
      type: z.enum([PRODUCT_TYPE.SIMPLE, PRODUCT_TYPE.VARIABLE], {
        required_error: "Product type is required",
      }),
      description: z.string().trim().optional(),
      shortDescription: z.string().optional(),
      additionalInfo: z.string().optional(),
      usageGuidelines: z.string().optional(),
      previewLink: z
        .string()
        .url({ message: "previewLink must be a valid URL" })
        .optional(),
      image: imageSchema,
      price: priceSchema.optional(),
      inventory: InventoryValidation.inventorySchema.optional(),
      attributes: z.array(createProductAttribute).optional(),
      variations: z.array(variationSchema).optional(),
      brand: z.string().optional(),
      category: z.array(z.string()).min(1, "Category is required"),
      featured: z.boolean().optional(),
      downloadable: z.boolean().optional(),
      review: z.boolean().optional(),
      warranty: z.boolean().optional(),
      warrantyInfo: warrantyInfo.optional(),
      tag: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          })
        )
        .optional(),
      seoData: productSeoValidationSchema.optional(),
      offer: z
        .object({
          flash: z.boolean().optional(),
          today: z.boolean().optional(),
          featured: z.boolean().optional(),
        })
        .optional(),
      publishedStatus: publishedStatusSchema,
    })
    .superRefine((data, ctx) => {
      if (
        data.type === PRODUCT_TYPE.VARIABLE &&
        (!data.variations || data.variations.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Variations are required for variable products",
          path: ["variations"],
        });
      }
      if (data.type === PRODUCT_TYPE.SIMPLE) {
        if (data.variations && data.variations.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Variations should be empty for simple products",
            path: ["variations"],
          });
        }
        if (data.attributes && data.attributes.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Attributes should be empty for simple products",
            path: ["attributes"],
          });
        }
      }
    }),
  productCollection: z.array(z.string()).optional(),
  relatedProducts: z.array(z.string()).optional(),
});

const updateProduct = z.object({
  body: z.object({
    title: z.string().trim().optional(),
    type: z.enum([PRODUCT_TYPE.SIMPLE, PRODUCT_TYPE.VARIABLE]).optional(),
    description: z.string().trim().optional(),
    shortDescription: z.string().trim().optional(),
    additionalInfo: z.string().trim().optional(),
    usageGuidelines: z.string().trim().optional(),
    previewLink: z
      .string()
      .url({ message: "previewLink must be a valid URL" })
      .optional(),
    image: imageSchema.partial().optional(),
    price: priceSchema.partial().optional(),
    inventory: InventoryValidation.inventorySchema.optional(),
    attributes: z.array(createProductAttribute).optional(),
    variations: z.array(variationSchema).optional(),
    brand: z.string().optional(),
    category: z.array(z.string()).min(1, "Category is required").optional(),
    featured: z.boolean().optional(),
    downloadable: z.boolean().optional(),
    review: z.boolean().optional(),
    warranty: z.boolean().optional(),
    warrantyInfo: warrantyInfo.partial().optional(),
    tag: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        })
      )
      .optional(),
    seoData: productSeoValidationSchema.optional(),
    offer: z
      .object({
        flash: z.boolean().optional(),
        today: z.boolean().optional(),
        featured: z.boolean().optional(),
      })
      .optional(),
    publishedStatus: publishedStatusSchema.optional(),
    productCollection: z.array(z.string()).optional(),
    relatedProducts: z.array(z.string()).optional(),
  }),
});

export const ProductValidation = {
  product,
  updateProduct,
};
