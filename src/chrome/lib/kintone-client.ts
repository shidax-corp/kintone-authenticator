import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { getCachedRecords, setCachedRecords } from './storage';
import type { ExtensionSettings, KintoneRecord } from './types';

export class KintoneClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KintoneClientError';
  }
}

export class KintoneClient {
  private client: KintoneRestAPIClient;
  private appId: string;

  constructor(settings: ExtensionSettings, appId: string) {
    this.client = new KintoneRestAPIClient({
      baseUrl: settings.kintoneBaseUrl,
      auth: {
        username: settings.kintoneUsername,
        password: settings.kintonePassword,
      },
    });
    this.appId = appId;
  }

  private extractRecordData(record: any): KintoneRecord {
    return {
      recordId: record.$id.value,
      name: record.name?.value || '',
      url: record.url?.value || '',
      username: record.username?.value || '',
      password: record.password?.value || '',
      otpAuthUri: record.otpuri?.value || '',
      updatedTime: record.更新日時?.value || new Date().toISOString(),
    };
  }

  async getRecords(useCache = true): Promise<KintoneRecord[]> {
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

      const records: KintoneRecord[] = response.records.map((record) =>
        this.extractRecordData(record)
      );

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

  async updateRecord(
    recordId: string,
    data: {
      name?: string;
      url?: string;
      username?: string;
      password?: string;
      otpAuthUri?: string;
    }
  ): Promise<void> {
    try {
      const record: any = {};
      if (data.name !== undefined) record.name = { value: data.name };
      if (data.url !== undefined) record.url = { value: data.url };
      if (data.username !== undefined)
        record.username = { value: data.username };
      if (data.password !== undefined)
        record.password = { value: data.password };
      if (data.otpAuthUri !== undefined)
        record.otpuri = { value: data.otpAuthUri };

      await this.client.record.updateRecord({
        app: this.appId,
        id: recordId,
        record,
      });

      // Clear cache to force refresh
      await this.getRecords(false);
    } catch (error) {
      throw new KintoneClientError(
        `Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async deleteRecord(recordId: string): Promise<void> {
    try {
      await this.client.record.deleteRecords({
        app: this.appId,
        ids: [recordId],
      });

      // Clear cache to force refresh
      await this.getRecords(false);
    } catch (error) {
      throw new KintoneClientError(
        `Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`
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
