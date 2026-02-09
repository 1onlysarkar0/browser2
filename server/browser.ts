import { lightpanda } from "@lightpanda/browser";
import puppeteer from "puppeteer-core";
import { type Step } from "@shared/schema";
import { storage } from "./storage";

let pandaProc: any = null;
let isBrowserRunning = false;

// Initialize browser on start
export async function initBrowser() {
  if (isBrowserRunning) return;
  
  try {
    console.log("Starting Lightpanda server...");
    // Start Lightpanda CDP server
    pandaProc = await lightpanda.serve({
        host: '127.0.0.1',
        port: 9222
    });
    isBrowserRunning = true;
    console.log("Lightpanda server started on port 9222.");
  } catch (error) {
    console.error("Failed to start Lightpanda server:", error);
    isBrowserRunning = false;
  }
}

export function getBrowserStatus() {
  return isBrowserRunning ? "running" : "stopped";
}

export async function stopBrowser() {
    if (pandaProc) {
        pandaProc.stdout.destroy();
        pandaProc.stderr.destroy();
        pandaProc.kill();
        pandaProc = null;
        isBrowserRunning = false;
    }
}

export async function runAutomationSteps(automationId: number, steps: Step[]) {
  if (!isBrowserRunning) {
    throw new Error("Browser (Lightpanda) not running");
  }

  let browser = null;
  let page = null;

  try {
    // Connect Puppeteer to Lightpanda
    browser = await puppeteer.connect({
        browserWSEndpoint: `ws://127.0.0.1:9222`
    });

    page = await browser.newPage();
  
    await storage.updateAutomationStatus(automationId, "running");
    await storage.updateLastRun(automationId, new Date());

    for (const step of steps) {
      console.log(`Executing step: ${step.type} for automation ${automationId}`);
      
      switch (step.type) {
        case "goto": {
          const url = step.selector && step.selector.startsWith("http") ? step.selector : step.value;
          if (url && url !== "none") {
            console.log(`Navigating to ${url}`);
            try {
              await page.goto(url, {
                timeout: 30000,
                waitUntil: "domcontentloaded",
              });
            } catch (navError: any) {
              if (
                navError.message?.includes("frame was detached") ||
                navError.message?.includes("LifecycleWatcher disposed") ||
                navError.message?.includes("Connection closed")
              ) {
                console.warn(`Navigation to ${url} caused a connection/frame issue — reconnecting and retrying`);
                await page.close().catch(() => {});
                await browser!.disconnect().catch(() => {});
                browser = await puppeteer.connect({
                  browserWSEndpoint: `ws://127.0.0.1:9222`,
                });
                page = await browser.newPage();
                try {
                  await page.goto(url, {
                    timeout: 30000,
                    waitUntil: "domcontentloaded",
                  });
                } catch (retryError: any) {
                  if (
                    retryError.message?.includes("frame was detached") ||
                    retryError.message?.includes("LifecycleWatcher disposed") ||
                    retryError.message?.includes("Connection closed")
                  ) {
                    console.warn(`Navigation to ${url} frame-detached on retry — treating as completed (likely an SSE/streaming endpoint)`);
                  } else {
                    throw retryError;
                  }
                }
              } else {
                throw navError;
              }
            }
          }
          break;
        }
        
        case "click":
          if (step.selector) {
            console.log(`Clicking ${step.selector}`);
            await page.click(step.selector);
          }
          break;
          
        case "type":
          if (step.selector && step.value) {
            console.log(`Typing into ${step.selector}`);
            await page.type(step.selector, step.value);
          }
          break;
          
        case "wait":
          if (step.value) {
            const ms = parseInt(step.value) * 1000;
            console.log(`Waiting ${ms}ms`);
            await new Promise(resolve => setTimeout(resolve, ms));
          }
          break;
      }
    }
    
    await storage.updateAutomationStatus(automationId, "stopped");
  } catch (error) {
    console.error(`Error running automation ${automationId}:`, error);
    await storage.updateAutomationStatus(automationId, "error");
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.disconnect().catch(() => {});
  }
}
