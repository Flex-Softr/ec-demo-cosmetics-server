import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import generateSlug from "../../../utilities/generateSlug";
import successResponse from "../../../utilities/successResponse";
import { ProductServices } from "./product.service";

const createProduct = catchAsync(async (req, res) => {
  const createdBy = req.user.id || req.user._id;
  if (!req.body.slug) {
    req.body.slug = generateSlug(req.body.title);
  }

  const result = await ProductServices.createProductIntoDB(createdBy, req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Product created successfully",
    data: result,
  });
});

const getAProductCustomer = catchAsync(async (req, res) => {
  const slug = req.params.slug;
  if (slug == "null") {
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Product details retrieved successfully",
      data: [],
    });
    return;
  }
  const result = await ProductServices.getAProductCustomerFromDB(slug);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product details retrieved successfully",
    data: result,
  });
});

const getAProductAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ProductServices.getAProductAdminFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product details retrieved successfully",
    data: result,
  });
});

const getAllProductsCustomer = catchAsync(async (req, res) => {
  const { meta, data } = await ProductServices.getAllProductsCustomerFromDB(
    req.query
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All Products retrieved successfully",
    meta,
    data,
  });
});

const getAllProductsAdmin = catchAsync(async (req, res) => {
  const { meta, countsByStatus, data } =
    await ProductServices.getAllProductsAdminFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All Products retrieved successfully",
    meta,
    data: {
      countsByStatus,
      data,
    },
  });
});

const getFeaturedProducts = catchAsync(async (req, res) => {
  const { meta, data } = await ProductServices.getFeaturedProductsFromDB(
    req.query
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Featured Products retrieved successfully",
    meta: meta,
    data: data,
  });
});

const getBestSellingProducts = catchAsync(async (req, res) => {
  const { meta, data } = await ProductServices.getBestSellingProductsFromDB(
    req.query
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Best selling products retrieved successfully!",
    meta: meta,
    data: data,
  });
});

const getProductPriceRange = catchAsync(async (req, res) => {
  const result = await ProductServices.getProductPriceRangeFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product price range retrieved successfully!",
    data: result,
  });
});

const getRelatedProducts = catchAsync(async (req, res) => {
  const slug = req.params.slug;
  if (!slug) {
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Related products retrieved successfully!",
      data: [],
    });
    return;
  }
  const result = await ProductServices.getRelatedProductsFromDB(slug);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Related products retrieved successfully!",
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const updatedBy = req.user.id || req.user._id;
  const ProductId = req.params.id;
  const { title, slug } = req.body;

  if (!slug) {
    req.body.slug = generateSlug(title);
  }

  const result = await ProductServices.updateProductIntoDB(
    updatedBy,
    ProductId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req, res) => {
  const deletedBy = req.user.id || req.user._id;
  const { productIds } = req.body;
  await ProductServices.deleteProductFromDB(productIds, deletedBy);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product deleted successfully",
    data: null,
  });
});

export const ProductControllers = {
  createProduct,
  getAProductCustomer,
  getAProductAdmin,
  getAllProductsCustomer,
  getAllProductsAdmin,
  getFeaturedProducts,
  getBestSellingProducts,
  getProductPriceRange,
  getRelatedProducts,
  updateProduct,
  deleteProduct,
};
