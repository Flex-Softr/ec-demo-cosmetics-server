import compression from "compression";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import userAgent from "express-useragent";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import requestIp from "request-ip";
import config from "./app/config/config";
import "./app/crons";
import { ecSIDHandler } from "./app/middlewares/ecSID";
import enableCrossOriginResourcePolicy from "./app/middlewares/enableCrossOriginResourcePolicy";
import globalErrorhandler from "./app/middlewares/globalErrorHandler";
import { notFoundRoute } from "./app/middlewares/notFoundRoute";
import router from "./app/routes";
const app: Application = express();

const corsOptions: CorsOptions = {
  origin:
    config.env === "production"
      ? config.clientSideURL?.split(",")
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:8000",
        ],
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

if (config.env === "production") {
  app.set("trust proxy", 1);
}

// Middlewares
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "1mb" })); // Default 100 KB, You can increase this as needed
app.use(compression());
app.use(cookieParser());
app.use(userAgent.express());
app.use(requestIp.mw());
if (config.env === "development") {
  app.use(morgan("dev"));
}

// handle custom session
app.use(ecSIDHandler);

// Root route
app.get("/", (req, res) => {
  res.send(`Server is running on ${config.env} mode`);
});

// static files
const uploadsPath = path.join(__dirname, "..", "uploads/public");
app.use(
  "/uploads/public",
  enableCrossOriginResourcePolicy,
  express.static(uploadsPath)
);

const employProfilePicture = path.join(__dirname, "..", "uploads/employ");
app.use(
  "/uploads/employ",
  enableCrossOriginResourcePolicy,
  express.static(employProfilePicture)
);

const imageToOrder = path.join(__dirname, "..", "uploads/image_to_order");
app.use(
  "/uploads/image_to_order",
  enableCrossOriginResourcePolicy,
  express.static(imageToOrder)
);

// Warranty claim request videos and images
const warrantyclaimVideosImages = path.join(
  __dirname,
  "..",
  "uploads/warranty_claim"
);
app.use(
  "/uploads/warranty_claim",
  enableCrossOriginResourcePolicy,
  express.static(warrantyclaimVideosImages)
);

// api endpoints
app.use("/api/v1", router);

// Global error handler
app.use(globalErrorhandler);

// handle not found route
app.use(notFoundRoute);

export default app;
