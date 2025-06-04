
export interface Cookie {
  name: string;
  domain: string;
  data: string;
  expires: number;
}

export function makeCookie({ name, domain, data, expires }: Cookie) {
  const secure = (domain.includes("localhost")) ? true : false;
  const date = new Date(expires);

  return `${name}=${data}; Domain=${domain}; Expires=${date.toUTCString()}; HttpOnly${secure ? "; Secure" : ""}`;

}
