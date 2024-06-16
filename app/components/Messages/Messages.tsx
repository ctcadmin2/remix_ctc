import {
  Indicator,
  ActionIcon,
  Drawer,
  ScrollAreaAutosize,
  Alert,
  Text,
  Flex,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Message } from "@prisma/client";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { CheckCircle, Mail, Trash2 } from "react-feather";
import { useEventSource } from "remix-utils/sse/react";

import { loader } from "~/root";

const Messages = () => {
  const data = useLoaderData<typeof loader>();
  const [opened, { open, close }] = useDisclosure(false);
  const [messages, setMessages] = useState<Message[]>(data.messages);
  const newMessages = useEventSource("/messages");
  const deleteMessage = useFetcher({ key: "deleteMessage" });
  const deleteAll = useFetcher({ key: "deleteAll" });
  const readAll = useFetcher({ key: "readAll" });

  useEffect(() => {
    if (newMessages) {
      setMessages(JSON.parse(newMessages));
    }
  }, [newMessages]);

  return (
    <>
      <Drawer.Root
        styles={{
          content: { overflowY: "hidden" },
          header: { boxShadow: "0px 0px 8px 0px", marginBottom: "1rem" },
        }}
        opened={opened}
        onClose={close}
        // withCloseButton={false}
        position="right"
        offset={8}
        radius="md"
        scrollAreaComponent={ScrollAreaAutosize}
      >
        <Drawer.Overlay />
        <Drawer.Content>
          <Drawer.Header>
            <Flex
              miw={"100%"}
              gap={"xl"}
              direction="row"
              align={"center"}
              justify={"space-between"}
            >
              <Flex
                gap={"sm"}
                direction="row"
                align={"center"}
                justify={"flex-start"}
              >
                <ActionIcon
                  variant="transparent"
                  aria-label="Mark all read"
                  disabled={!(messages.length > 0)}
                  onClick={() =>
                    readAll.submit(
                      { _action: "readAll" },
                      { action: "/messages", method: "POST" },
                    )
                  }
                >
                  <CheckCircle style={{ width: "70%", height: "70%" }} />
                </ActionIcon>
                {data.user?.role === "admin" ? (
                  <ActionIcon
                    variant="transparent"
                    aria-label="Delete all messages"
                    disabled={!(messages.length > 0)}
                    onClick={() =>
                      deleteAll.submit(
                        { _action: "deleteAll" },
                        { action: "/messages", method: "POST" },
                      )
                    }
                  >
                    <Trash2
                      style={{ width: "70%", height: "70%", color: "red" }}
                    />
                  </ActionIcon>
                ) : null}
              </Flex>
              <Drawer.CloseButton />
            </Flex>
          </Drawer.Header>
          <Drawer.Body>
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <Alert
                  styles={{ root: { margin: "1rem" } }}
                  key={index}
                  variant="light"
                  color={message.status === "ok" ? "green" : "yellow"}
                  withCloseButton={true}
                  onClose={() =>
                    deleteMessage.submit(
                      { _action: "deleteMessage", id: message.id },
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
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>

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
