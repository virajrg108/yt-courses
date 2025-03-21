import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add an API endpoint to provide the YouTube API key to the frontend
  app.get('/api/config', (req, res) => {
    res.json({
      youtubeApiKey: process.env.YOUTUBE_API_KEY
    });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
