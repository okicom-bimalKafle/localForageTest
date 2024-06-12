// Web crypto API を利用してデータを暗号化/復号化する
import { IndexdDB } from "./index";

export type EncryptoData = {
  data: ArrayBuffer;
  iv: number[];
};

export class WebCrypto {
  public static async encrypto<T>(uid: string, data: T) {
    const salt = await this._getSalt();
    const secretKey = await this._getSecretKey(uid, salt);
    return await this._encryptoData(secretKey, data);
  }

  public static async decrypto(uid: string, data: EncryptoData) {
    const salt = await this._getSalt();
    const secretKey = await this._getSecretKey(uid, salt);
    return await this._decryptoData(secretKey, data);
  }

  private static async _getSalt(): Promise<Uint8Array> {
    const storeSalt = await IndexdDB.getCustomerTemp1();
    if (storeSalt && storeSalt.length) {
      return storeSalt;
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    await IndexdDB.setCustomerTemp1(salt);
    return salt;
  }

  private static async _getFixedField() {
    const ff = await IndexdDB.getCustomerTemp2();
    if (ff && ff.length) {
      return ff;
    }
    const value = crypto.getRandomValues(new Uint8Array(12));
    await IndexdDB.setCustomerTemp2(value);
    return value;
  }

  private static async _getInvocationField() {
    const invf = await IndexdDB.getCustomerTemp3();
    if (invf && invf.length) {
      return invf;
    }
    const value = new Uint32Array(1);
    value[0]++;
    await IndexdDB.setCustomerTemp3(value);
    return value;
  }

  private static async _getSecretKey(
    uid: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    // 文字列をTyped Arrayに変換する。
    const passwordUint8Array = new TextEncoder().encode(uid);
    const digest = await crypto.subtle.digest(
      // ハッシュ値の計算に用いるアルゴリズム。
      { name: "SHA-256" },
      passwordUint8Array
    );
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      digest,
      { name: "PBKDF2" },
      // 鍵のエクスポートを許可するかどうかの指定。falseでエクスポートを禁止する。
      false,
      // 鍵の用途。ここでは、「鍵の変換に使う」と指定している。
      ["deriveKey"]
    );
    const secretKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100, // ストレッチングの回数。
        hash: "SHA-256",
      },
      keyMaterial,
      // アルゴリズム。
      { name: "AES-GCM", length: 256 },
      // 鍵のエクスポートを禁止する。
      false,
      // 鍵の用途は、「データの暗号化と復号に使う」と指定。
      ["encrypt", "decrypt"]
    );
    return secretKey;
  }

  private static async _getInitVector(): Promise<Uint8Array> {
    let fixedPart = new Uint8Array(12);
    const result = await this._getFixedField();
    fixedPart = result;
    const invocationPart = await this._getInvocationField();
    // 固定部と形式を揃えるため、Uint8Arrayに変換する。
    const newInvocationPart = new Uint8Array(invocationPart.buffer);
    // 2つのTyped Arrayの各桁をスプレッド構文で並べて、
    // 新しい配列を生成
    const concated = [...fixedPart, ...newInvocationPart];
    // その配列をTyped Arrayに変換
    const iv = Uint8Array.from(concated);
    return iv;
  }

  private static async _encryptoData<T>(
    secretKey: CryptoKey,
    data: T
  ): Promise<EncryptoData> {
    const inputData = new TextEncoder().encode(JSON.stringify(data));
    let iv: Uint8Array = new Uint8Array();
    // 初期ベクトル
    const aiv = await this._getInitVector();
    iv = aiv;
    const encryptedArrayBuffer = await crypto.subtle.encrypt(
      // 暗号アルゴリズムの指定とパラメータ。
      { name: "AES-GCM", iv },
      // 事前に用意しておいた鍵。
      secretKey,
      // ArrayBufferまたはTyped Arrayに変換した入力データ。
      inputData
    );

    return {
      data: encryptedArrayBuffer,
      iv: Array.from(iv),
    };
  }

  private static async _decryptoData(secretKey: CryptoKey, data: EncryptoData) {
    try {
      // 通常のArrayとして保存しておいた初期ベクトルをUint8Arrayに戻す
      const iv = Uint8Array.from(data.iv);

      const decryptedArrayBuffer = await crypto.subtle.decrypt(
        // 暗号アルゴリズムの指定とパラメータ。暗号化時と同じ内容を指定する。
        { name: "AES-GCM", iv },
        // 暗号化の際に使用した物と同じ鍵。
        secretKey,
        // ArrayBufferまたはTyped Arrayに変換した暗号化済みデータ。
        data.data
      );

      const decryptedString = new TextDecoder().decode(
        new Uint8Array(decryptedArrayBuffer)
      );
      return JSON.parse(decryptedString);
    } catch (err) {
      console.log("decrypt error", err, data);
      return undefined;
    }
  }
}
