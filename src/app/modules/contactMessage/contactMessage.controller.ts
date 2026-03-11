import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { ContactMessageService } from "./contactMessage.service";

const createContactMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactMessageService.createContactMessageIntoDB(
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Contact message sent successfully!",
    data: result,
  });
});

const getAllContactMessages = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ContactMessageService.getAllContactMessagesFromDB();

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Contact messages retrieved successfully!",
      data: result,
    });
  }
);

const getSingleContactMessage = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result =
      await ContactMessageService.getSingleContactMessageFromDB(id);

    successResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Contact message retrieved successfully!",
      data: result,
    });
  }
);

const deleteContactMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ContactMessageService.deleteContactMessageFromDB(id);

  successResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contact message deleted successfully!",
    data: result,
  });
});

export const ContactMessageController = {
  createContactMessage,
  getAllContactMessages,
  getSingleContactMessage,
  deleteContactMessage,
};
