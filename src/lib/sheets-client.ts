/**
 * Google Sheets API Client for Island Todo Branding Blueprint
 *
 * Wraps the Google Sheets API v4 for CRUD operations on brand data.
 * Used by Cloudflare Pages Functions (server-side only).
 */

// Sheet names in the master spreadsheet
export const SHEETS = {
  BRANDS: 'Brands',
  RESPONSES: 'Questionnaire_Responses',
  GENERATED_CONTENT: 'Generated_Content',
  TEAM_MEMBERS: 'Team_Members',
  ASSETS: 'Assets',
  ACTIVITY_LOG: 'Activity_Log',
  SYSTEM_CONFIG: 'System_Config',
} as const;

export interface Brand {
  brandId: string;
  brandName: string;
  slug: string;
  ownerEmail: string;
  createdAt: string;
  status: 'draft' | 'active' | 'archived';
  phaseCompleted: number;
}

export interface QuestionnaireResponse {
  brandId: string;
  phase: number;
  questionId: number;
  questionText: string;
  response: string;
  updatedAt: string;
}

export interface TeamMember {
  brandId: string;
  email: string;
  role: 'owner' | 'manager' | 'viewer';
  invitedAt: string;
  acceptedAt: string | null;
}

/**
 * Initialize the Sheets client with a service account.
 *
 * In production, the service account key is stored as a Cloudflare
 * environment variable (GOOGLE_SERVICE_ACCOUNT_KEY).
 */
export async function getSheetsClient(serviceAccountKey: string, spreadsheetId: string) {
  // Parse the service account key
  const key = JSON.parse(serviceAccountKey);

  // Create JWT for Google API authentication
  const jwt = await createGoogleJWT(key);

  return {
    /**
     * Read all rows from a sheet.
     */
    async getRows(sheetName: string): Promise<string[][]> {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      const data = await response.json() as { values?: string[][] };
      return data.values || [];
    },

    /**
     * Append a row to a sheet.
     */
    async appendRow(sheetName: string, values: string[]): Promise<void> {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [values],
          }),
        }
      );
    },

    /**
     * Update a specific cell range.
     */
    async updateRange(range: string, values: string[][]): Promise<void> {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );
    },

    /**
     * Find rows matching a column value.
     */
    async findRows(
      sheetName: string,
      columnIndex: number,
      value: string
    ): Promise<{ rowIndex: number; values: string[] }[]> {
      const rows = await this.getRows(sheetName);
      const matches: { rowIndex: number; values: string[] }[] = [];

      // Skip header row (index 0)
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][columnIndex] === value) {
          matches.push({ rowIndex: i, values: rows[i] });
        }
      }

      return matches;
    },
  };
}

/**
 * Create a JWT for Google API authentication using a service account.
 * This runs in Cloudflare Workers (Web Crypto API).
 */
async function createGoogleJWT(serviceAccountKey: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key for signing
  const pemContents = serviceAccountKey.private_key
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64url(
    String.fromCharCode(...new Uint8Array(signature))
  );

  const jwt = `${signatureInput}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json() as { access_token: string };
  return tokenData.access_token;
}

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
