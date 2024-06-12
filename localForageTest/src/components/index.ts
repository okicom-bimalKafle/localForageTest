import localforage from "localforage";
import { INDEXEDDB_INFO, DB_STORE, DB_STORE_CLASS_TYPE } from "./indexeddb_api";
import { WebCrypto, EncryptoData } from "./webcrypto";
import { UserIndexedDB } from "./user";
import { usePiniaStore } from "./piniaStore";
import { UserData } from "./UserModel";
/**
 * storeName: 保存するデータを示す
 * key: テーブルのkey (domainId)
 * data: 保存するデータ
 *
 * 保存(1raw)
 * await IndexdDB.set(storeName, key, data);
 *
 * 取得(1raw)
 * await IndexdDB.get(storeName, key);
 *
 * 取得(一括)
 * await IndexdDB.getAll(storeName);
 */
export class IndexdDB {
  private static dbList: Record<string, LocalForage> = {};
  /** idbへデータ保存 */
  public static async set<T extends DB_STORE, S extends DB_STORE_CLASS_TYPE<T>>(
    storeName: T,
    key: string,
    value: S[]
  ): Promise<void> {
    const db = this._getDBInstance(storeName);
    if (!db) {
      return;
    }
    const encrypto = await WebCrypto.encrypto(key, value);
    this._setItem(db, key, encrypto);
  }

  /** idbからデータ取得 */
  public static async get<T extends DB_STORE, S extends DB_STORE_CLASS_TYPE<T>>(
    storeName: T,
    key: string
  ): Promise<S[]> {
    const db = this._getDBInstance(storeName);
    if (!db) {
      return [];
    }
    const encrypto = await this._getItem(db, key);
    const decrypto = await WebCrypto.decrypto(key, encrypto);
    if (!decrypto) {
      this._removeItem(db, key);
      return [];
    }
    return this._restore(storeName, decrypto);
  }

  /** idbへデータ保存(一括) */
  public static async getAll<
    T extends DB_STORE,
    S extends DB_STORE_CLASS_TYPE<T>
  >(storeName: T): Promise<Record<string, S[]>> {
    const db = this._getDBInstance(storeName);
    if (!db) {
      return {};
    }
    const record = await this._getRecord(db);
    const results: Record<string, S[]> = {};
    await Promise.all(
      Object.keys(record).map(async (key: string) => {
        const encrypto = record[key];
        const decrypto = (await WebCrypto.decrypto(key, encrypto)) as S[];
        if (decrypto) {
          results[key] = this._restore(storeName, decrypto);
        } else {
          // 読み取りに失敗した場合
          // キャッシュの削除
          this._removeItem(db, key);
        }
      })
    );
    return results;
  }

  /** DB全削除 */
  public static async dropDB(): Promise<void> {
    // DB削除対象
    const storeList: DB_STORE[] = [DB_STORE.USERS];
    await Promise.all(
      storeList.map(async (storeName) => {
        const db = this._getDBInstance(storeName);
        if (!db) {
          return;
        }
        // データ削除
        await this._clear(db);
        // DB削除
        await this._dropDBInstance(db);

        if (this.dbList[storeName]) {
          // dbListの削除
          delete this.dbList[storeName];
        }
      })
    );
    // localStorageのsaltリセット
    await this._resetCustomerTemp();
  }

  /** DB/store のテーブル名を取得 */
  private static _getDBInstance(storeName: DB_STORE): LocalForage | undefined {
    try {
      debugger;
      if (this.dbList[storeName]) {
        // 既に作成済みなら返す
        return this.dbList[storeName];
      }

      let dummyName = "";
      switch (storeName) {
        case UserIndexedDB.getStoreName(): {
          dummyName = UserIndexedDB.getDummyName();
          break;
        }
        default: {
          // 未対応
          break;
        }
      }
      if (!dummyName) {
        return undefined;
      }
      const db = localforage.createInstance({
        name: INDEXEDDB_INFO.NAME, // 名前空間
        storeName: dummyName, // 名前空間内のインスタンスの識別名
        version: INDEXEDDB_INFO.VERSION, // バージョン
      });
      this.dbList[storeName] = db;
      return db;
    } catch (err) {
      console.log("_getDBInstance", err);
      return undefined;
    }
  }

  /** DB/store のテーブルを削除 */
  private static async _dropDBInstance(db: LocalForage): Promise<void> {
    try {
      await db.dropInstance();
    } catch (err) {
      console.log("_dropDBInstance", err);
    }
  }

  /** データ復元 */
  // TODO: as, anyを使わない型定義の検討
  private static _restore<T extends DB_STORE, S extends DB_STORE_CLASS_TYPE<T>>(
    storeName: T,
    decrypto: UserData[] | { data: UserData[] }
  ): S[] {
    switch (storeName) {
      case UserIndexedDB.getStoreName(): {
        const data = "data" in decrypto ? decrypto.data : decrypto;
        return UserIndexedDB.restore(data) as S[];
      }
      default: {
        return [];
      }
    }
  }
  // idbにアイテムを書き込み(1組織分) (key: domainId)
  private static async _setItem(
    db: LocalForage,
    domainId: string,
    data: EncryptoData
  ): Promise<void> {
    try {
      await db.setItem(domainId, data);
    } catch (err) {
      console.log("_setItem", err);
    }
  }

  // idbからアイテムを取得(1組織分) (key: domainId)
  private static async _getItem(
    db: LocalForage,
    domainId: string
  ): Promise<EncryptoData> {
    try {
      const dbItem = (await db.getItem(domainId)) as EncryptoData;
      return dbItem;
    } catch (err) {
      console.log("_getItem", err);
      return { data: new ArrayBuffer(0), iv: [] };
    }
  }

  // idbのアイテムを削除(1組織分) (key: domainId)
  private static async _removeItem(
    db: LocalForage,
    domainId: string
  ): Promise<void> {
    try {
      await db.removeItem(domainId);
    } catch (err) {
      console.log("_removeItem", err);
    }
  }

  // idbからアイテムを取得(一括)
  private static async _getRecord(
    db: LocalForage
  ): Promise<Record<string, EncryptoData>> {
    try {
      const keys = await this._getKeys(db);
      const results: Record<string, EncryptoData> = {};
      await Promise.all(
        keys.map(async (domainId) => {
          const dbItem = await this._getItem(db, domainId);
          results[domainId] = dbItem;
        })
      );
      return results;
    } catch (err) {
      console.log("/_getRecord", err);
      return {};
    }
  }

  // idbのデータ一括削除
  private static async _clear(db: LocalForage): Promise<void> {
    try {
      await db.clear();
    } catch (err) {
      console.log("_clear", err);
    }
  }

  // DB/storeの key(組織ID)を一括取得
  private static async _getKeys(db: LocalForage): Promise<string[]> {
    return await db.keys();
  }

  /** 暗号化復号化saltの取得 */
  public static async getCustomerTemp1(): Promise<Uint8Array> {
    return await usePiniaStore().getSalt1();
  }

  public static async getCustomerTemp2(): Promise<Uint8Array> {
    return await usePiniaStore().getSalt2();
  }

  public static async getCustomerTemp3(): Promise<Uint32Array> {
    return await usePiniaStore().getSalt3();
  }

  /** 暗号化復号化saltの保存 */
  public static async setCustomerTemp1(salt: Uint8Array): Promise<void> {
    await usePiniaStore().setSalt1(salt);
  }

  public static async setCustomerTemp2(salt: Uint8Array): Promise<void> {
    await usePiniaStore().setSalt2(salt);
  }

  public static async setCustomerTemp3(salt: Uint32Array): Promise<void> {
    await usePiniaStore().setSalt3(salt);
  }

  /** 暗号化復号化saltの一括リセット */
  private static async _resetCustomerTemp(): Promise<void> {
    const reset1 = async () => await this.setCustomerTemp1(new Uint8Array());
    const reset2 = async () => await this.setCustomerTemp2(new Uint8Array());
    const reset3 = async () => await this.setCustomerTemp3(new Uint32Array());
    await Promise.all([reset1(), reset2(), reset3()]);
  }
}
