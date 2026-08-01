import { Router } from "express";
import { SalesRoutes } from "./sales/sales.routes";

const route = Router();

route.use("/sales", SalesRoutes);

export const ReportsRoutes = route;
