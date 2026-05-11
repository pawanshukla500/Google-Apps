
import express from "express";
import path from "path";
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Maximize payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // Google Drive Parents
  const PARENT_FOLDER_ID = '17oK2gaEcWDHG_Z6vFt2QzgG7t98ajxJD';

  // API Route: Heartbeat
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Sync to Drive
  app.post("/api/sync-to-drive", async (req, res) => {
    const { sku, images } = req.body;

    try {
      const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!credentialsString) {
        return res.status(500).json({ 
          error: "Google Service Account credentials not found in environment variables. Please add GOOGLE_SERVICE_ACCOUNT_KEY." 
        });
      }

      let auth;
      try {
        // Try to parse as JSON if it's a service account key
        const credentials = JSON.parse(credentialsString);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      } catch (e) {
        // Fallback to simple API key if not JSON (though drive writes are limited with keys)
        return res.status(400).json({ 
          error: "Credentials must be a valid Service Account JSON. Please verify the pasted key." 
        });
      }

      const drive = google.drive({ version: 'v3', auth });

      const folderName = sku || `Photoshoot-${Date.now()}`;

      // 1. Check if folder exists or create it
      let folderId;
      const searchRes = await drive.files.list({
        q: `'${PARENT_FOLDER_ID}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
      });

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        folderId = searchRes.data.files[0].id;
      } else {
        const createFolderRes = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [PARENT_FOLDER_ID],
          },
          fields: 'id',
        });
        folderId = createFolderRes.data.id;
      }

      // 2. Upload images
      const uploadPromises = images.map(async (img: any) => {
        const base64Content = img.base64.split(',')[1];
        const buffer = Buffer.from(base64Content, 'base64');
        const filename = `${folderName}-pose-${img.poseId}.png`;

        return drive.files.create({
          requestBody: {
            name: filename,
            parents: [folderId],
          },
          media: {
            mimeType: 'image/png',
            body: buffer as any,
          },
        });
      });

      await Promise.all(uploadPromises);

      res.json({ 
        success: true, 
        message: `Successfully synced ${images.length} images to SKU folder: ${folderName}`,
        folderUrl: `https://drive.google.com/drive/folders/${folderId}`
      });
    } catch (error: any) {
      console.error('Drive API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error during Drive sync' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
