import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { eventStream } from "remix-utils/sse/server";

import { db } from "~/utils/db.server";
import { emitter } from "~/utils/emitter";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  return eventStream(request.signal, (send) => {
    const handle = async () => {
      const message = await db.message.findMany({
        where: { users: { every: { id: { not: 1 } } } }, //TODO send unread for current user
        orderBy: { createdAt: "desc" },
        take: 1,
      });
      send({
        data: JSON.stringify(message[0]),
      });
    };
    emitter.addListener("messages", handle);
    return () => {
      emitter.removeListener("messages", handle);
    };
  });
};
