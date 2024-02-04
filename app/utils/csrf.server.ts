import { createCookie } from "@remix-run/node";
import { CSRF } from "remix-utils/csrf/server";

export const cookie = createCookie("csrf", {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  secrets: process.env.COOKIE_SECRETS, //TODO change
});

//TODO customize
export const csrf = new CSRF({
  cookie,
  // what key in FormData objects will be used for the token, defaults to `csrf`
  formDataKey: "csrf",
  // an optional secret used to sign the token, recommended for extra safety
  secret: process.env.CSRF_SECRET, //TODO change
});
