import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { encrypt, decrypt } from '../../lib/crypto';
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
  private passphrase: string;

  constructor(settings: ExtensionSettings, appId: string) {
    this.client = new KintoneRestAPIClient({
      baseUrl: settings.kintoneBaseUrl,
      auth: {
        username: settings.kintoneUsername,
        password: settings.kintonePassword,
      },
    });
    this.appId = appId;
    this.passphrase = settings.passphrase;
  }

  private async encryptSensitiveData(data: { password?: string; otpAuthUri?: string }) {
    const result: { password?: string; otpAuthUri?: string } = {};

    if (data.password) {
      result.password = await encrypt(data.password, this.passphrase);
    }

    if (data.otpAuthUri) {
      result.otpAuthUri = await encrypt(data.otpAuthUri, this.passphrase);
    }

    return result;
  }

  private async decryptSensitiveData(record: any): Promise<KintoneRecord> {
    try {
      const password = record.password?.value ?
        await decrypt(record.password.value, this.passphrase) : '';

      const otpAuthUri = record.otpuri?.value ?
        await decrypt(record.otpuri.value, this.passphrase) : '';

      return {
        recordId: record.$id.value,
        name: record.name?.value || '',
        url: record.url?.value || '',
        username: record.username?.value || '',
        password,
        otpAuthUri,
        updatedTime: record.更新日時?.value || new Date().toISOString(),
      };
    } catch (error) {
      throw new KintoneClientError(`Failed to decrypt record data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        fields: ['$id', 'name', 'url', 'username', 'password', 'otpuri', '更新日時'],
      });

      const decryptedRecords = await Promise.all(
        response.records.map(record => this.decryptSensitiveData(record))
      );

      await setCachedRecords(decryptedRecords);
      return decryptedRecords;
    } catch (error) {
      if (useCache) {
        const cached = await getCachedRecords();
        if (cached) {
          return cached;
        }
      }

      throw new KintoneClientError(`Failed to get records: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const encryptedData = await this.encryptSensitiveData({
        password: data.password,
        otpAuthUri: data.otpAuthUri,
      });

      const record = {
        name: { value: data.name },
        url: { value: data.url },
        username: { value: data.username },
        password: { value: encryptedData.password || '' },
        otpuri: { value: encryptedData.otpAuthUri || '' },
      };

      const response = await this.client.record.addRecord({
        app: this.appId,
        record,
      });

      // Clear cache to force refresh
      const records = await this.getRecords(false);
      return response.id;
    } catch (error) {
      throw new KintoneClientError(`Failed to create record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateRecord(recordId: string, data: {
    name?: string;
    url?: string;
    username?: string;
    password?: string;
    otpAuthUri?: string;
  }): Promise<void> {
    try {
      const encryptedData = await this.encryptSensitiveData({
        password: data.password,
        otpAuthUri: data.otpAuthUri,
      });

      const record: any = {};
      if (data.name !== undefined) record.name = { value: data.name };
      if (data.url !== undefined) record.url = { value: data.url };
      if (data.username !== undefined) record.username = { value: data.username };
      if (encryptedData.password !== undefined) record.password = { value: encryptedData.password };
      if (encryptedData.otpAuthUri !== undefined) record.otpuri = { value: encryptedData.otpAuthUri };

      await this.client.record.updateRecord({
        app: this.appId,
        id: recordId,
        record,
      });

      // Clear cache to force refresh
      await this.getRecords(false);
    } catch (error) {
      throw new KintoneClientError(`Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new KintoneClientError(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
