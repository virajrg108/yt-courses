import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // This is a frontend-only application, no backend endpoints needed
  // All data is stored in IndexedDB and YouTube API calls are made directly from the frontend
  
  const httpServer = createServer(app);
  return httpServer;
}
