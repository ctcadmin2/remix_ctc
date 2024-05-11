import {
  Indicator,
  ActionIcon,
  Drawer,
  ScrollAreaAutosize,
  FocusTrapInitialFocus,
  Alert,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Message } from "@prisma/client";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Mail } from "react-feather";
import { useEventSource } from "remix-utils/sse/react";

import { loader } from "~/root";

const Messages = () => {
  const data = useLoaderData<typeof loader>();
  const [opened, { open, close }] = useDisclosure(false);
  const [messages, setMessages] = useState<Message[]>(data.messages);
  const newMessages = useEventSource("/messages");
  const fetcher = useFetcher({ key: "deleteMessage" });

  useEffect(() => {
    if (newMessages) {
      setMessages(JSON.parse(newMessages));
    }
  }, [newMessages]);

  return (
    <>
      <Drawer
        styles={{ content: { overflowY: "hidden" } }}
        opened={opened}
        onClose={close}
        withCloseButton={false}
        position="right"
        offset={8}
        radius="md"
        scrollAreaComponent={ScrollAreaAutosize}
      >
        <FocusTrapInitialFocus />
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <Alert
              styles={{ root: { margin: "1rem" } }}
              key={index}
              variant="light"
              color={message.status === "ok" ? "green" : "yellow"}
              withCloseButton={true}
              onClose={() =>
                fetcher.submit(
                  { id: message.id },
                  { action: "/messages", method: "POST" },
                )
              }
            >
              {message.content}
            </Alert>
          ))
        ) : (
          <Text>No new messages.</Text>
        )}
      </Drawer>

      <Indicator color="red" label={messages.length} size={16}>
        <ActionIcon
          variant="transparent"
          size={"xl"}
          aria-label="Messages"
          color="blue"
          onClick={() => open()}
        >
          <Mail size={32} />
        </ActionIcon>
      </Indicator>
    </>
  );
};

export default Messages;
