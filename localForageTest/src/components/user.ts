import { UserData } from "./UserModel.ts";
import { DB_STORE } from "./indexeddb_api";

const STORE_NAME = DB_STORE.USERS;
const DUMMY_NAME = "DATA1";

export class UserIndexedDB {
  public static getStoreName(): DB_STORE {
    return STORE_NAME;
  }

  public static getDummyName(): string {
    return DUMMY_NAME;
  }

  // データを復元
  public static restore(users: UserData[] | { data: UserData[] }): UserData[] {
    let usersArray: UserData[] = [];

    if (Array.isArray(users)) {
      usersArray = users; // If users is already an array, use it directly
    } else if (Array.isArray(users.data)) {
      usersArray = users.data; // If users is an object with a data property containing an array, use that array
    } else {
      console.error("Input is not an array:", users);
      return []; // or handle the error in an appropriate way
    }

    const results: UserData[] = usersArray.map((item) => {
      const user = UserData.create(item);
      return user;
    });

    return results;
  }
}
