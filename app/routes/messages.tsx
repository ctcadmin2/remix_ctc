import {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { jsonWithError, jsonWithSuccess } from "remix-toast";
import { eventStream } from "remix-utils/sse/server";
import { z } from "zod";
import { parseForm } from "zodix";

import { db } from "~/utils/db.server";
import { emitter } from "~/utils/emitter";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  return eventStream(request.signal, function setup(send) {
    const handle = async () => {
      const message = await db.message.findMany({
        where: { users: { none: { id: user.id } } },
        orderBy: { createdAt: "desc" },
      });
      send({ data: JSON.stringify(message) });
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

  const { _action, id } = await parseForm(request, {
    _action: z.union([
      z.literal("deleteMessage"),
      z.literal("deleteAll"),
      z.literal("readAll"),
    ]),
    id: z.string().optional(),
  });

  switch (_action) {
    case "deleteMessage":
      try {
        const m = await db.message.update({
          where: { id },
          data: { users: { connect: { id: user.id } } },
        });
        if (m) {
          emitter.emit("messages");
          return jsonWithSuccess(null, "Message deleted.");
        }
        return jsonWithError(null, "Message could not be deleted.");
      } catch (error) {
        return jsonWithError(null, `Error while deleting message: ${error}`);
      }
    case "deleteAll":
      try {
        const m = await db.message.deleteMany({});
        if (m) {
          emitter.emit("messages");
          return jsonWithSuccess(null, "All messages were deleted.");
        }
        return jsonWithError(null, "Messages could not be deleted.");
      } catch (error) {
        return jsonWithError(null, `Error while deleting messages: ${error}`);
      }

    case "readAll":
      try {
        //TODO implement readall messages
        if (_action) {
          emitter.emit("messages");
          return jsonWithSuccess(null, "All messages were marked as read.");
        }
        return jsonWithError(null, "Messages could not be updated.");
      } catch (error) {
        return jsonWithError(null, `Error while updating messages: ${error}`);
      }

    default:
      return jsonWithError(null, "No action defined.");
  }
};
