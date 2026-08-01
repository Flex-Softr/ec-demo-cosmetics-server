import { z } from "zod";

const orderReport = z.object({
  query: z.object({
    filter: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  }),
});

export const DashboardValidation = {
  orderReport,
};
