import { UserData } from "./UserModel.ts";

export const INDEXEDDB_INFO = {
  NAME: "openchannel",
  VERSION: 4,
};

// indexedDB/store のテーブル名
export const DB_STORE = {
  USERS: "USERS",
} as const;

export type DB_STORE = (typeof DB_STORE)[keyof typeof DB_STORE];

// DB_STOREのテーブル名 から store の型を返す
export type DB_STORE_CLASS_TYPE<T extends DB_STORE> = T extends "USERS"
  ? UserData
  : any;

//  DB_STOREのテーブル名 と連動する store の型一覧
export type DB_STORE_CLASS_TYPES = UserData;
