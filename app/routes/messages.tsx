import {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { jsonWithError, jsonWithSuccess } from "remix-toast";
import { eventStream } from "remix-utils/sse/server";
import { stringify } from "superjson";
import { z } from "zod";
import { parseForm } from "zodix";

import { db } from "~/utils/db.server";
import { emitter } from "~/utils/emitter";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  emitter.emit("messages");
  return eventStream(request.signal, function setup(send) {
    const handle = async () => {
      const messages = await db.message.findMany({
        where: { users: { none: { id: 1 } } },
      });
      send({ data: stringify(messages) });
    };
    emitter.on("messages", handle);

    return function clear() {
      emitter.off("messages", handle);
    };
  });
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  console.log(user);

  const { id } = await parseForm(request, {
    id: z.string(),
  });

  try {
    const m = await db.message.update({
      where: { id },
      data: { users: { connect: { id: user.id } } },
    });
    if (m) {
      console.log(m);
      emitter.emit("messages");
      return jsonWithSuccess(null, "Message deleted.");
    }
    return jsonWithError(null, "Message could not be deleted.");
  } catch (error) {
    return jsonWithError(null, `Error while deleting message: ${error}`);
  }
};
