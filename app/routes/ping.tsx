import { json } from "@remix-run/server-runtime";

export async function loader() {
  return json(null);
}

export async function action() {
  return json(null);
}
