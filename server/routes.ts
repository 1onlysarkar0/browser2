import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { initBrowser, getBrowserStatus, runAutomationSteps } from "./browser";
import { z } from "zod";
import https from "https";
import http from "http";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize browser on startup
  initBrowser();

  // --- Automations CRUD ---

  app.get(api.automations.list.path, async (_req, res) => {
    const automations = await storage.getAutomations();
    res.json(automations);
  });

  app.get(api.automations.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const automation = await storage.getAutomation(id);
    if (!automation) {
      return res.status(404).json({ message: "Automation not found" });
    }
    res.json(automation);
  });

  app.post(api.automations.create.path, async (req, res) => {
    try {
      const input = api.automations.create.input.parse(req.body);
      const automation = await storage.createAutomation(input);
      res.status(201).json(automation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
    }
  });

  app.put(api.automations.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.automations.update.input.parse(req.body);
      
      const existing = await storage.getAutomation(id);
      if (!existing) {
        return res.status(404).json({ message: "Automation not found" });
      }

      const updated = await storage.updateAutomation(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
    }
  });

  app.delete(api.automations.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await storage.getAutomation(id);
    if (!existing) {
      return res.status(404).json({ message: "Automation not found" });
    }
    await storage.deleteAutomation(id);
    res.status(204).send();
  });

  // --- Automation Actions ---

  app.post(api.automations.start.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const automation = await storage.getAutomation(id);
    
    if (!automation) {
      return res.status(404).json({ message: "Automation not found" });
    }

    // Trigger async execution
    // Note: In a real app we might want a job queue
    runAutomationSteps(id, automation.steps).catch(err => {
      console.error("Background automation failed:", err);
    });

    res.json({ message: "Automation started" });
  });

  app.post(api.automations.stop.path, async (req, res) => {
    // Currently Lightpanda/Puppeteer doesn't support easy "stop" of a running promise chain 
    // without abort signals or page closing. 
    // This is a placeholder for now.
    const id = parseInt(req.params.id);
    await storage.updateAutomationStatus(id, "stopped");
    res.json({ message: "Stop signal sent (implementation pending)" });
  });

  // --- System ---

  app.get(api.health.check.path, (_req, res) => {
    res.json({
      status: "ok",
      browser: getBrowserStatus()
    });
  });

  // --- Proxy for Iframe ---
  // Simple proxy to bypass CORS for the iframe preview
  // Note: This is a basic implementation.
  app.get(api.proxy.get.path, (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).send("Missing url");
    }

    try {
      const targetUrl = new URL(url);
      const client = targetUrl.protocol === "https:" ? https : http;
      
      const proxyReq = client.get(url, (proxyRes) => {
        // Handle redirect if needed (basic)
        if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          return res.redirect(`/api/proxy?url=${encodeURIComponent(proxyRes.headers.location)}`);
        }
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (e) => {
        console.error("Proxy error:", e.message);
        res.status(502).json({ error: "Could not connect to the target website. Check the URL and try again." });
      });
      
    } catch (e) {
      res.status(400).send("Invalid URL format. Please include http:// or https://");
    }
  });

  return httpServer;
}
