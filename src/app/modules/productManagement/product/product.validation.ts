import { z } from "zod";
import { productStatus } from "./product.const";

const createProductAttribute = z.object({
  name: z.string().trim().min(1, { message: "Attribute name is required!" }),
  values: z
    .array(z.string().trim())
    .min(1, { message: "Attribute values are required!" }),
});

const category = z.object({
  name: z.string().min(1, { message: "Category is required!" }),
  subCategory: z.string().optional(),
});

const warrantyInfo = z.object({
  duration: z.object({
    quantity: z.string().trim().optional(),
    unit: z.string().optional(),
  }),
  terms: z.string().optional(),
});

const publishedStatusSchema = z.enum([...Object.values(productStatus)] as [
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

const inventorySchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  stockStatus: z.string().optional(),
  stockQuantity: z.number().optional(),
  stockAvailable: z.number().optional(),
  preStockQuantity: z.number().optional(),
  productCode: z.string().optional(),
  manageStock: z.boolean().optional(),
  lowStockWarning: z.number().optional(),
  hideStock: z.boolean().optional(),
});

const variationSchema = z.object({
  attributes: z.record(z.string(), z.string()),
  price: priceSchema,
  inventory: inventorySchema,
  offer: z
    .object({
      flash: z.boolean().optional(),
      today: z.boolean().optional(),
      featured: z.boolean().optional(),
    })
    .optional(),
  image: z.string().optional(),
});

const product = z.object({
  body: z
    .object({
      title: z.string().trim().min(1, { message: "Title is required!" }),
      slug: z.string().trim().optional(),
      type: z.enum(["simple", "variable"], {
        required_error: "Product type is required",
      }),
      description: z.string().trim().optional(),
      shortDescription: z.string().optional(),
      additionalInfo: z.string().optional(),
      usageGuidelines: z.string().optional(),
      image: imageSchema,
      price: priceSchema.optional(),
      inventory: inventorySchema.optional(),
      attributes: z.array(createProductAttribute).optional(),
      variations: z.array(variationSchema).optional(),
      brand: z.string().optional(),
      category: category,
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
      seoData: z
        .object({
          focusKeyphrase: z.string().optional(),
          metaTitle: z.string().optional(),
          slug: z.string().optional(),
          metaDescription: z.string().optional(),
        })
        .optional(),
      offer: z
        .object({
          flash: z.boolean().optional(),
          today: z.boolean().optional(),
          featured: z.boolean().optional(),
        })
        .optional(),
      publishedStatus: publishedStatusSchema,
    })
    .refine(
      (data) => {
        if (
          data.type === "variable" &&
          (!data.variations || data.variations.length === 0)
        ) {
          return false;
        }
        return true;
      },
      {
        message: "Variations are required for variable products",
        path: ["variations"],
      }
    ),
});

const updateProduct = z.object({
  body: z.object({
    title: z.string().trim().optional(),
    type: z.enum(["simple", "variable"]).optional(),
    description: z.string().trim().optional(),
    shortDescription: z.string().trim().optional(),
    additionalInfo: z.string().trim().optional(),
    usageGuidelines: z.string().trim().optional(),
    image: imageSchema.partial().optional(),
    price: priceSchema.partial().optional(),
    inventory: inventorySchema.partial().optional(),
    attributes: z.array(createProductAttribute).optional(),
    variations: z.array(variationSchema).optional(),
    brand: z.string().optional(),
    category: category.partial().optional(),
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
    seoData: z
      .object({
        focusKeyphrase: z.string().optional(),
        metaTitle: z.string().optional(),
        slug: z.string().optional(),
        metaDescription: z.string().optional(),
      })
      .optional(),
    offer: z
      .object({
        flash: z.boolean().optional(),
        today: z.boolean().optional(),
        featured: z.boolean().optional(),
      })
      .optional(),
    publishedStatus: publishedStatusSchema.optional(),
  }),
});

export const ProductValidation = {
  product,
  updateProduct,
};
