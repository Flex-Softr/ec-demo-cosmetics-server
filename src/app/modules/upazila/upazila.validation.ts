import { z } from "zod";

const create = z.object({
  body: z.object({
    upazilas: z
      .object({
        id: z.string({ required_error: "Id is required" }),
        name: z.string({ required_error: "Name is required" }),
        bn_name: z.string({ required_error: "Bangla name is required" }),
        district_id: z.string({
          required_error: "District id is required",
        }),
      })
      .array(),
  }),
});

export const UpzilaValidation = {
  create,
};
