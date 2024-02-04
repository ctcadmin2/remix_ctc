import type { User } from "@prisma/client";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcryptjs from "bcryptjs";
import { Authenticator, AuthorizationError } from "remix-auth";
import { FormStrategy } from "remix-auth-form";

import { db } from "./db.server";

const { compare, hash } = bcryptjs;
const sessionSecret = process.env.SESSION_SECRET;
export const DEFAULT_REDIRECT = "/login";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  language: "en" | "ro";
}

const login = async ({ email, password }: LoginForm) => {
  const user = await db.user.findUnique({
    where: { email },
  });
  if (!user) throw new AuthorizationError("Bad Credentials");
  const isCorrectPassword = compare(password, user.hash as string);
  if (!isCorrectPassword) throw new AuthorizationError("Bad Credentials");

  const { hash, ...rest } = user;
  return rest;
};

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set!");
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  },
});

export const authenticator = new Authenticator<Partial<User>>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    // do some validation, errors are in the sessionErrorKey
    if (!email || email?.length === 0)
      throw new AuthorizationError("Bad Credentials: Email is required");
    if (typeof email !== "string")
      throw new AuthorizationError("Bad Credentials: Email must be a string");

    if (!password || password?.length === 0)
      throw new AuthorizationError("Bad Credentials: Password is required");
    if (typeof password !== "string")
      throw new AuthorizationError(
        "Bad Credentials: Password must be a string"
      );

    return await login({ email, password });
  }),
  "user-pass"
);

export const register = async (data: RegisterForm) => {
  const { password, ...rest } = data;

  const hashed = await hash(password, 10);
  const user = await db.user.create({
    data: { ...rest, hash: hashed },
  });
  return { id: user.id };
};

export const { getSession, commitSession } = sessionStorage;

export const createUserSession = async (userId: number, redirectTo: string) => {
  const session = await getSession();
  session.set("userId", userId);
  session.flash("toastMessage", "Welcome back.");
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};
