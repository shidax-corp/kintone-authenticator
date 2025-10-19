import { KintoneRestAPIClient } from '@kintone/rest-api-client';

import { getCachedRecords, setCachedRecords } from '../lib/storage';
import type { ExtensionSettings } from '../lib/types';

export class KintoneClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KintoneClientError';
  }
}

export class KintoneClient {
  private client: KintoneRestAPIClient;
  private appId: string;
  private settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this.client = new KintoneRestAPIClient({
      baseUrl: settings.kintoneBaseUrl,
      auth: {
        username: settings.kintoneUsername,
        password: settings.kintonePassword,
      },
    });
    this.appId = settings.kintoneAppId;
    this.settings = settings;
  }

  async getRecords(useCache = true): Promise<kintone.types.SavedFields[]> {
    try {
      if (useCache) {
        const cached = await getCachedRecords();
        if (cached) {
          return cached;
        }
      }

      const response = await this.client.record.getRecords({
        app: this.appId,
        fields: [
          '$id',
          'name',
          'url',
          'username',
          'password',
          'otpuri',
          '更新日時',
        ],
      });

      const records =
        response.records as unknown as kintone.types.SavedFields[];

      await setCachedRecords(records);
      return records;
    } catch (error) {
      if (useCache) {
        const cached = await getCachedRecords();
        if (cached) {
          return cached;
        }
      }

      throw new KintoneClientError(
        `Failed to get records: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async createRecord(data: {
    name: string;
    url: string;
    username: string;
    password: string;
    otpAuthUri?: string;
  }): Promise<string> {
    try {
      const record = {
        name: { value: data.name },
        url: { value: data.url },
        username: { value: data.username },
        password: { value: data.password },
        otpuri: { value: data.otpAuthUri || '' },
        shareto: { value: [{ code: this.settings.kintoneUsername }] },
      };

      const response = await this.client.record.addRecord({
        app: this.appId,
        record,
      });

      // Clear cache to force refresh
      await this.getRecords(false);
      return response.id;
    } catch (error) {
      throw new KintoneClientError(
        `Failed to create record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.app.getApp({ id: this.appId });
      return true;
    } catch {
      return false;
    }
  }
}
