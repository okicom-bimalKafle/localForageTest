export class UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  ip_address: string;

  constructor(
    id: number,
    first_name: string,
    last_name: string,
    email: string,
    gender: string,
    ip_address: string
  ) {
    this.id = id;
    this.first_name = first_name;
    this.last_name = last_name;
    this.email = email;
    this.gender = gender;
    this.ip_address = ip_address;
  }

  static create(data: UserData): UserData {
    return new UserData(
      data.id ?? 0,
      data.first_name ?? "",
      data.last_name ?? "",
      data.email ?? "",
      data.gender ?? "",
      data.ip_address ?? ""
    );
  }
}
