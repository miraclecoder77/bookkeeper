import { APP_FOLDER_NAME, DRIVE_FILE_NAMES } from '../config';
import {
  Transaction,
  Invoice,
  Client,
  BusinessSettings,
} from '../types';

let appFolderId: string | null = null;

export const initializeDriveConnection = (accessToken: string): void => {
  if (window.gapi?.client) {
    window.gapi.client.setToken({ access_token: accessToken });
  }
};

export const getAppFolderOrCreate = async (): Promise<string> => {
  if (appFolderId) return appFolderId;

  try {
    // Search for existing app folder
    const response = await window.gapi.client.drive.files.list({
      q: `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
      pageSize: 1,
    });

    if (response.result.files && response.result.files.length > 0) {
      const id = response.result.files[0].id;
      if (!id) throw new Error('App folder ID not found in response');
      appFolderId = id;
      return id;
    }

    // Create app folder if it doesn't exist
    const createResponse = await window.gapi.client.drive.files.create({
      resource: {
        name: APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    const id = createResponse.result.id;
    if (!id) throw new Error('Failed to create app folder');
    appFolderId = id;
    return id;
  } catch (error) {
    console.error('Error getting/creating app folder:', error);
    throw error;
  }
};

export const getDriveFileId = async (fileName: string): Promise<string | null> => {
  try {
    const folderId = await getAppFolderOrCreate();

    const response = await window.gapi.client.drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
      pageSize: 1,
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }

    return null;
  } catch (error) {
    console.error(`Error getting Drive file ID for ${fileName}:`, error);
    throw error;
  }
};

export const uploadFile = async (
  fileName: string,
  content: any,
  fileId?: string
): Promise<string> => {
  try {
    const folderId = await getAppFolderOrCreate();

    const fileContent = JSON.stringify(content, null, 2);

    if (fileId) {
      // Update existing file
      await window.gapi.client.drive.files.update({
        fileId,
        resource: {
          name: fileName,
        },
        media: {
          mimeType: 'application/json',
          body: fileContent,
        },
      });
      return fileId;
    } else {
      // Create new file
      const response = await window.gapi.client.drive.files.create({
        resource: {
          name: fileName,
          parents: [folderId],
          mimeType: 'application/json',
        },
        media: {
          mimeType: 'application/json',
          body: fileContent,
        },
        fields: 'id',
      });

      return response.result.id;
    }
  } catch (error) {
    console.error(`Error uploading file ${fileName}:`, error);
    throw error;
  }
};

export const downloadFile = async (fileId: string): Promise<any> => {
  try {
    const response = await window.gapi.client.drive.files.get({
      fileId,
      alt: 'media',
    });

    return response.result;
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error);
    throw error;
  }
};

// Sync functions
export const syncTransactionsToServer = async (
  transactions: Transaction[]
): Promise<void> => {
  try {
    const fileId = await getDriveFileId(DRIVE_FILE_NAMES.transactions);
    await uploadFile(DRIVE_FILE_NAMES.transactions, transactions, fileId || undefined);
  } catch (error) {
    console.error('Error syncing transactions:', error);
    throw error;
  }
};

export const syncInvoicesToServer = async (invoices: Invoice[]): Promise<void> => {
  try {
    const fileId = await getDriveFileId(DRIVE_FILE_NAMES.invoices);
    await uploadFile(DRIVE_FILE_NAMES.invoices, invoices, fileId || undefined);
  } catch (error) {
    console.error('Error syncing invoices:', error);
    throw error;
  }
};

export const syncClientsToServer = async (clients: Client[]): Promise<void> => {
  try {
    const fileId = await getDriveFileId(DRIVE_FILE_NAMES.clients);
    await uploadFile(DRIVE_FILE_NAMES.clients, clients, fileId || undefined);
  } catch (error) {
    console.error('Error syncing clients:', error);
    throw error;
  }
};

export const syncSettingsToServer = async (
  settings: BusinessSettings
): Promise<void> => {
  try {
    const fileId = await getDriveFileId(DRIVE_FILE_NAMES.settings);
    await uploadFile(DRIVE_FILE_NAMES.settings, settings, fileId || undefined);
  } catch (error) {
    console.error('Error syncing settings:', error);
    throw error;
  }
};

export const loadTransactionsFromServer = async (): Promise<Transaction[]> => {
  try {
    const fileId = await getDriveFileId(DRIVE_FILE_NAMES.transactions);
    if (!fileId) return [];

    const data = await downloadFile(fileId);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

export const loadInvoicesFromServer = async (): Promise<Invoice[]> => {
  try {
    const fileId = await getDriveFileId(DRIVE_FILE_NAMES.invoices);
    if (!fileId) return [];

    const data = await downloadFile(fileId);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading invoices:', error);
    return [];
  }
};

export const loadClientsFromServer = async (): Promise<Client[]> => {
  try {
    const fileId = await getDriveFileId(DRIVE_FILE_NAMES.clients);
    if (!fileId) return [];

    const data = await downloadFile(fileId);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading clients:', error);
    return [];
  }
};

export const loadSettingsFromServer = async (): Promise<BusinessSettings | null> => {
  try {
    const fileId = await getDriveFileId(DRIVE_FILE_NAMES.settings);
    if (!fileId) return null;

    const data = await downloadFile(fileId);
    return data || null;
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
};
