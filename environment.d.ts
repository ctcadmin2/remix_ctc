declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      TEST_DATABASE_URL: string;
      NODE_ENV: string;
      ITEMS_PER_PAGE: string;
      SESSION_SECRET: string;
      OPENAPI_KEY: string;
      CSRF_SECRET: string;
      COOKIE_SECRETS: string[];
      ANAF_AUTH_URL: string;
      ANAF_TOKEN_URL: string;
      ANAF_REVOKE_URL: string;
      TOKEN: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export type {};
