import {
  Indicator,
  ActionIcon,
  Drawer,
  ScrollAreaAutosize,
  FocusTrapInitialFocus,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Message } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Mail } from "react-feather";
import { useEventSource } from "remix-utils/sse/react";
import { parse } from "superjson";

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const lastMessage = useEventSource("/messages");
  const fetcher = useFetcher({ key: "checkMessage" });

  //TODO improve solution
  useEffect(() => {
    if (messages.length === 0) {
      fetcher.submit({}, { action: "/messages" });
    }
    setMessages((curentMessages) => {
      if (lastMessage !== null) {
        return parse(lastMessage);
      }
      return curentMessages;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

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
        {messages.map((message, index) => (
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
        ))}
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
