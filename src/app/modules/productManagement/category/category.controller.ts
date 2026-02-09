import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import generateSlug from "../../../utilities/generateSlug";
import successResponse from "../../../utilities/successResponse";
import { CategoryServices } from "./category.service";

const createCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const { name } = req.body;
  req.body.slug = generateSlug(name);

  const result = await CategoryServices.createCategoryIntoDB(
    createdBy,
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Category created successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req, res) => {
  const result = await CategoryServices.getAllCategoriesFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully",
    data: result,
  });
});

const getSingleCategory = catchAsync(async (req, res) => {
  const result = await CategoryServices.getSingleCategoryFromDB(req.params.id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Category retrieved successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const updatedBy = req.user.id;
  const categoryId = req.params.id;
  const { name } = req.body;
  if (name) {
    req.body.slug = generateSlug(name);
  }
  const result = await CategoryServices.updateCategoryIntoDB(
    updatedBy,
    categoryId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const { categoryIds } = req.body;
  await CategoryServices.deleteCategoryFromDB(createdBy, categoryIds);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Category deleted successfully",
    data: null,
  });
});

export const CategoryControllers = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
