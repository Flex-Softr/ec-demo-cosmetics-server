import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import generateSlug from "../../../utilities/generateSlug";
import successResponse from "../../../utilities/successResponse";
import { ProductServices } from "./product.service";
import modifiedPriceData from "./product.utils";

const createProduct = catchAsync(async (req, res) => {
  const createdBy = req.user.id || req.user._id;
  if (!req.body.slug) {
    req.body.slug = generateSlug(req.body.title);
  } else {
    req.body.slug = generateSlug(req.body.slug);
  }

  if (req.body.inventory?.stockQuantity) {
    req.body.inventory.stockAvailable = req.body.inventory.stockQuantity;
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
      message: "Product retrieved successfully",
      data: [],
    });
    return;
  }
  const result = await ProductServices.getAProductCustomerFromDB(slug);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product retrieved successfully",
    data: result,
  });
});

const getAProductAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ProductServices.getAProductAdminFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product retrieved successfully",
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

const updateProduct = catchAsync(async (req, res) => {
  const updatedBy = req.user.id || req.user._id;
  const ProductId = req.params.id;
  const { title, slug, price } = req.body;

  if (title) {
    req.body.title = title.replace(/\s+/g, " ").trim();
    req.body.slug = generateSlug(title, slug);
  }
  if (price) {
    modifiedPriceData(req);
  }

  if (req.body?.inventory?.stockQuantity) {
    const stockQuantityIncrease =
      req.body.inventory.stockQuantity - req.body.inventory.preStockQuantity;

    // if (stockQuantityIncrease > 0) {
    //   req.body.inventory.stockAvailable += stockQuantityIncrease;
    // }
    req.body.inventory.stockAvailable += stockQuantityIncrease;
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
  updateProduct,
  deleteProduct,
};
