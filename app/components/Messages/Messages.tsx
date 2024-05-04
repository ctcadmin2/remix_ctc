import { Menu, Indicator, ActionIcon } from "@mantine/core";
import { useState, useEffect } from "react";
import { Mail } from "react-feather";
import { useEventSource } from "remix-utils/sse/react";
import { parse } from "superjson";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const lastMessage = useEventSource("/messages");

  useEffect(() => {
    setMessages((datums) => {
      if (lastMessage !== null) {
        console.log(parse(lastMessage));
        return datums.concat(parse(lastMessage));
      }
      return datums;
    });
  }, [lastMessage]);

  return (
    <Menu shadow="md" position="bottom-end" trigger="click-hover">
      <Menu.Target>
        <Indicator color="red" label={messages.length} size={16}>
          <ActionIcon
            variant="transparent"
            size={"xl"}
            aria-label="Messages"
            color="blue"
          >
            <Mail size={32} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        {messages ? (
          messages.map((message, messageIdx) => (
            <Menu.Item
              // color={message.status === "nok" ? "red" : "gray.1"}
              key={messageIdx}
            >
              {message}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item>No messages</Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default Messages;
