import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import generateSlug from "../../../utilities/generateSlug";
import successResponse from "../../../utilities/successResponse";
import { BrandServices } from "./brand.service";

const createBrand = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const { name } = req.body;
  req.body.slug = generateSlug(name);

  const result = await BrandServices.createBrandIntoDB(createdBy, req.body);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Brand created successfully",
    data: result,
  });
});

const getAllBrands = catchAsync(async (req, res) => {
  const result = await BrandServices.getAllBrandsFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Brands retrieved successfully",
    data: result,
  });
});

const updateBrand = catchAsync(async (req, res) => {
  const updatedBy = req.user.id;
  const brandId = req.params.id;
  const { name } = req.body;
  req.body.slug = generateSlug(name);

  const result = await BrandServices.updateBrandIntoDB(
    updatedBy,
    brandId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Brand updated successfully",
    data: result,
  });
});

const deleteBrand = catchAsync(async (req, res) => {
  const deletedBy = req.user.id;
  const { brandIds } = req.body;
  await BrandServices.deleteBrandFromDB(deletedBy, brandIds);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Brand deleted successfully",
    data: null,
  });
});

export const BrandControllers = {
  createBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
};
