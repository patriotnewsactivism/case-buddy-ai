// Type definitions for Google APIs
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback: (response: TokenResponse) => void;
        requestAccessToken(options: { prompt: string }): void;
      }
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: string;
      }): TokenClient;
    }
  }
  namespace picker {
    class DocsView {
      setIncludeFolders(value: boolean): DocsView;
      setSelectFolderEnabled(value: boolean): DocsView;
    }
    class PickerBuilder {
      setDeveloperKey(key: string): PickerBuilder;
      setOAuthToken(token: string): PickerBuilder;
      addView(view: DocsView | ViewId): PickerBuilder;
      setCallback(callback: (data: GooglePickerResponse) => void): PickerBuilder;
      setAppId(appId: string): PickerBuilder;
      build(): Picker;
    }
    class Picker {
      setVisible(visible: boolean): void;
    }
    enum ViewId {
      DOCS_AUDIO,
      DOCS_VIDEO
    }
    enum Action {
      PICKED,
      CANCEL
    }
  }
}

declare global {
  interface Window {
    gapi: {
      load(api: string, config: {
        callback?: () => void;
        onerror?: () => void;
      }): void;
    };
    google: typeof google;
  }
}

interface GooglePickerResponse {
  action: google.picker.Action | string;
  docs: Array<{
    id: string;
    name: string;
    mimeType: string;
  }>;
}

interface TokenResponse {
  access_token: string;
  error?: string;
}

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
}

interface DriveFilesResponse {
  files?: DriveFileMetadata[];
  nextPageToken?: string;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let savedAccessToken: string | null = null;
let scriptsLoadedPromise: Promise<void> | null = null;

/**
 * Dynamically loads Google Scripts (GAPI & GIS) with a singleton promise
 */
export const loadGoogleScripts = (): Promise<void> => {
    if (scriptsLoadedPromise) return scriptsLoadedPromise;

    scriptsLoadedPromise = new Promise((resolve, reject) => {
        let pickerLoaded = false;
        let gisLoaded = false;
        let timedOut = false;

        const timeout = setTimeout(() => {
            timedOut = true;
            reject(new Error("Google scripts failed to load (blocked by network or extensions)."));
        }, 10000);

        const checkDone = () => {
            if (pickerLoaded && gisLoaded && !timedOut) {
                clearTimeout(timeout);
                resolve();
            }
        };

        // Load GAPI (for Picker)
        const loadGapi = () => {
            const bootstrapPicker = () => {
                window.gapi.load('picker', {
                    callback: () => {
                        pickerLoaded = true;
                        checkDone();
                    },
                    onerror: () => reject(new Error("Picker failed to initialize. It may be blocked."))
                });
            };

            if (window.gapi) {
                bootstrapPicker();
            } else {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    if (window.gapi) {
                        bootstrapPicker();
                    } else {
                        reject(new Error("GAPI failed to initialize."));
                    }
                };
                script.onerror = () => reject(new Error("Failed to load Google API script"));
                document.body.appendChild(script);
            }
        };

        // Load GIS (for OAuth)
        const loadGis = () => {
            if (window.google && window.google.accounts) {
                gisLoaded = true;
                checkDone();
            } else {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    gisLoaded = true;
                    checkDone();
                };
                script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
                document.body.appendChild(script);
            }
        };

        loadGapi();
        loadGis();
    });

    return scriptsLoadedPromise;
};

/**
 * Initializes the Token Client (OAuth) logic
 */
const getAccessToken = async (clientId: string): Promise<string> => {
    await loadGoogleScripts();

    return new Promise((resolve, reject) => {
        if (savedAccessToken) {
            resolve(savedAccessToken);
            return;
        }

        if (!window.google || !window.google.accounts) {
            reject(new Error("Google Identity Services not loaded."));
            return;
        }

        if (!tokenClient) {
            try {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: '',
                });
            } catch (e) {
                reject(new Error("Failed to init token client. Check Client ID."));
                return;
            }
        }

        tokenClient.callback = (resp: TokenResponse) => {
            if (resp.error) {
                console.error("OAuth Error:", resp);
                reject(new Error(`OAuth Error: ${resp.error}`));
            } else {
                savedAccessToken = resp.access_token;
                resolve(resp.access_token);
            }
        };

        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

/**
 * Uploads a file to Google Drive using standard REST API
 */
export const uploadToDrive = async (
    clientId: string,
    folderName: string,
    fileName: string, 
    content: Blob | string,
    mimeType: string
): Promise<string> => {
    try {
        const accessToken = await getAccessToken(clientId);

        // Check for existing folder
        const folderQuery = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQuery)}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!folderRes.ok) throw new Error("Failed to search Drive folders.");
        const folderData = await folderRes.json() as DriveFilesResponse;
        
        let folderId = '';
        if (folderData.files && folderData.files.length > 0) {
            folderId = folderData.files[0].id;
        } else {
            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            if (!createRes.ok) throw new Error("Failed to create folder.");
            const createData = await createRes.json() as DriveFileMetadata;
            folderId = createData.id;
        }

        // Upload File
        const metadata = {
            name: fileName,
            parents: [folderId]
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        
        const fileContent = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
        formData.append('file', fileContent);

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.text();
            throw new Error(`Upload failed: ${err}`);
        }

        const result = await uploadRes.json() as DriveFileMetadata;
        return result.id;

    } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error("Drive Upload Error:", error);
        throw new Error(`Drive upload failed: ${error.message}`);
    }
};

/**
 * Downloads a file content via fetch
 */
const downloadDriveFile = async (fileId: string, fileName: string, mimeType: string, accessToken: string): Promise<File> => {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error("Failed to download file content");
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
};

/**
 * Helper to recursively list files in folders
 */
const listFilesRecursive = async (folderId: string, accessToken: string, apiKey: string, onProgress?: (msg: string) => void): Promise<File[]> => {
    const filesFound: File[] = [];
    const query = `'${folderId}' in parents and (mimeType contains 'audio/' or mimeType contains 'video/' or mimeType = 'application/vnd.google-apps.folder') and trashed = false`;
    let pageToken = null;

    do {
        const params = new URLSearchParams({
            q: query,
            fields: 'nextPageToken, files(id, name, mimeType)',
            key: apiKey
        });
        if (pageToken) params.append('pageToken', pageToken);

        const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!res.ok) break;
        const data = await res.json() as DriveFilesResponse;
        const files = data.files || [];

        for (const file of files) {
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                if (onProgress) onProgress(`Scanning ${file.name}...`);
                const children = await listFilesRecursive(file.id, accessToken, apiKey, onProgress);
                filesFound.push(...children);
            } else {
                if (onProgress) onProgress(`Downloading ${file.name}...`);
                filesFound.push(await downloadDriveFile(file.id, file.name, file.mimeType, accessToken));
            }
        }
        pageToken = data.nextPageToken;
    } while (pageToken);

    return filesFound;
};

/**
 * Opens the Google Drive Picker
 */
export const openDrivePicker = async (
    clientIdRaw: string, 
    apiKeyRaw: string, 
    onProgress?: (msg: string) => void
): Promise<File[]> => {
    const clientId = clientIdRaw?.trim();
    const apiKey = apiKeyRaw?.trim();

    if (!clientId || !apiKey) throw new Error("Missing Client ID or API Key");

    if (onProgress) onProgress("Initializing...");
    await loadGoogleScripts();

    const accessToken = await getAccessToken(clientId);

    return new Promise((resolve, reject) => {
        try {
            if (!window.google || !window.google.picker) {
                throw new Error("Picker API failed to load. Please disable ad blockers and try again.");
            }

            const view = new google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true);

            const pickerBuilder = new google.picker.PickerBuilder()
                .setDeveloperKey(apiKey)
                .setOAuthToken(accessToken)
                .addView(view)
                .addView(google.picker.ViewId.DOCS_AUDIO)
                .addView(google.picker.ViewId.DOCS_VIDEO)
                .setCallback(async (data: GooglePickerResponse) => {
                    if (data.action === google.picker.Action.PICKED) {
                        const docs = data.docs;
                        const results: File[] = [];
                        try {
                            for (let i = 0; i < docs.length; i++) {
                                const doc = docs[i];
                                if (onProgress) onProgress(`Processing ${i+1}/${docs.length}: ${doc.name}`);
                                
                                if (doc.mimeType === 'application/vnd.google-apps.folder') {
                                    const children = await listFilesRecursive(doc.id, accessToken, apiKey, onProgress);
                                    results.push(...children);
                                } else {
                                    results.push(await downloadDriveFile(doc.id, doc.name, doc.mimeType, accessToken));
                                }
                            }
                            resolve(results);
                        } catch (e) {
                            const error = e instanceof Error ? e : new Error(String(e));
                            reject(new Error("Download failed: " + error.message));
                        }
                    } else if (data.action === google.picker.Action.CANCEL) {
                        resolve([]);
                    }
                });
            
            try {
                const appId = clientId.split('-')[0];
                if (appId) pickerBuilder.setAppId(appId);
            } catch (e) {
                // Ignore app ID if parsing fails
            }

            const picker = pickerBuilder.build();
            picker.setVisible(true);

        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            reject(new Error("Failed to build picker: " + error.message));
        }
    });
};
