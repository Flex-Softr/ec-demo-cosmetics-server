import { Request, Response } from "express";
import mongoose from "mongoose";
import httpStatus from "http-status";

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d > 0 ? d + "d " : ""}${h}h ${m}m ${s}s`;
};

const formatMemory = (memory: {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}) => {
  return {
    rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`,
  };
};

const getHealth = async (req: Request, res: Response) => {
  const uptimeSeconds = process.uptime();
  const healthCheck = {
    uptime: formatUptime(uptimeSeconds),
    message: "OK",
    timestamp: Date.now(),
    system: {
      memory: formatMemory(process.memoryUsage()),
      cpu: process.cpuUsage(),
    },
    database: {
      status:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    },
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }
    res.status(httpStatus.OK).json({
      success: true,
      data: healthCheck,
    });
  } catch (error: unknown) {
    healthCheck.message =
      error instanceof Error ? error.message : "Unknown error";
    res.status(httpStatus.SERVICE_UNAVAILABLE).json({
      success: false,
      data: healthCheck,
    });
  }
};

export const HealthControllers = {
  getHealth,
};
