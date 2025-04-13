import { Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { WarrantyClaimServices } from "./warrantyClaim.service";

const getAllWarrantyClaimReq = catchAsync(
  async (req: Request, res: Response) => {
    const { meta, data } =
      await WarrantyClaimServices.getAllWarrantyClaimReqFromDB(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Warranty details retrieved successfully",
      meta,
      data,
    });
  }
);

const checkWarranty = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumber, warrantyCodes } = req.body;
  const warranty = await WarrantyClaimServices.checkWarrantyFromDB(
    phoneNumber,
    warrantyCodes
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Warranty details retrieved successfully",
    data: warranty,
  });
});

const createWarrantyClaimReq = catchAsync(
  async (req: Request, res: Response) => {
    const filesInfo = (req?.files as Express.Multer.File[])?.map((file) => ({
      path: file.path,
      fileType: file.mimetype.split("/")[0],
    }));

    const payload = {
      warrantyClaimReqData: req.anyData,
      ...req.body,
      videosAndImages: filesInfo,
    };

    const warranty =
      await WarrantyClaimServices.createWarrantyClaimIntoDB(payload);
    successResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Warranty claim request created successfully",
      data: warranty,
    });
  }
);

const updateWarrantyClaimReq = catchAsync(
  async (req: Request, res: Response) => {
    const warranty = await WarrantyClaimServices.updateWarrantyClaimReqIntoDB(
      new Types.ObjectId(req.params.id),
      req.body,
      req.user as TJwtPayload
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Warranty claim request updated successfully",
      data: warranty,
    });
  }
);

const createNewWarrantyClaimOrder = catchAsync(
  async (req: Request, res: Response) => {
    const warranty =
      await WarrantyClaimServices.createNewWarrantyClaimOrderIntoDB(
        req.params.id as unknown as Types.ObjectId,
        req.body,
        req.user as TJwtPayload
      );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "New warranty clam order created successfully",
      data: warranty,
    });
  }
);

const updateClaimProductVariation = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    const warranty =
      await WarrantyClaimServices.updateClaimProductVariationIntoDB(
        id,
        req.body
      );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Variation updated successfully!",
      data: warranty,
    });
  }
);

export const WarrantyClaimController = {
  getAllWarrantyClaimReq,
  checkWarranty,
  createWarrantyClaimReq,
  updateWarrantyClaimReq,
  createNewWarrantyClaimOrder,
  updateClaimProductVariation,
};
