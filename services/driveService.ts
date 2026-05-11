
/**
 * Service for interacting with the backend for Google Drive sync
 */

export interface DriveUploadResult {
  success: boolean;
  folderUrl?: string;
  error?: string;
}

export const syncToDrive = async (
  sku: string,
  images: { base64: string; poseId: number }[]
): Promise<DriveUploadResult> => {
  try {
    const response = await fetch('/api/sync-to-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sku,
        images
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error during sync');
    }

    return {
      success: true,
      folderUrl: data.folderUrl
    };
  } catch (error: any) {
    console.error('Drive Sync Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sync to Google Drive'
    };
  }
};

