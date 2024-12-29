"use client";

import DeleteIcon from "../icons/delete.svg";
import BotIcon from "../icons/bot.svg";

import styles from "@/app/components/home.module.scss";

import styles2 from "@/app/components/chat.module.scss";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";

import { useChatStore } from "../store";

import Locale from "../locales";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Path } from "../constant";
import { MaskAvatar } from "@/app/components/mask";
import { Mask } from "../store/mask";
import { useRef, useEffect } from "react";
import { showConfirm } from "@/app/components/ui-lib";
import { SideBarBody, SideBarContainer } from "./sidebar-next";

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
}) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (props.selected && draggableRef.current) {
      draggableRef.current?.scrollIntoView({
        block: "center",
      });
    }
  }, [props.selected]);

  const pathname = usePathname();
  return (
    <Draggable draggableId={`${props.id}`} index={props.index}>
      {(provided) => (
        <div
          className={`${styles["chat-item"]} ${
            props.selected &&
            (pathname === "/chat" || pathname === "/") &&
            styles["chat-item-selected"]
          }`}
          onClick={props.onClick}
          ref={(ele) => {
            draggableRef.current = ele;
            provided.innerRef(ele);
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          title={`${props.title}\n${Locale.ChatItem.ChatItemCount(
            props.count,
          )}`}
        >
          {props.narrow ? (
            <div className={styles["chat-item-narrow"]}>
              <div className={styles["chat-item-avatar"] + " no-dark"}>
                <MaskAvatar
                  avatar={props.mask.avatar}
                  model={props.mask.modelConfig.model}
                />
              </div>
              <div className={styles["chat-item-narrow-count"]}>
                {props.count}
              </div>
            </div>
          ) : (
            <>
              <div className={styles["chat-item-title"]}>{props.title}</div>
              <div className={styles["chat-item-info"]}>
                <div className={styles["chat-item-count"]}>
                  {Locale.ChatItem.ChatItemCount(props.count)}
                </div>
                <div className={styles["chat-item-date"]}>{props.time}</div>
              </div>
            </>
          )}

          <div
            className={styles["chat-item-delete"]}
            onClickCapture={(e) => {
              props.onDelete?.();
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <DeleteIcon />
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function ChatList(props: { narrow?: boolean }) {
  const [sessions, selectedIndex, selectSession, moveSession] = useChatStore(
    (state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.moveSession,
    ],
  );
  const chatStore = useChatStore();
  const router = useRouter();
  // const isMobileScreen = false;

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveSession(source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="chat-list">
        {(provided) => (
          <div
            className={styles["chat-list"]}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {sessions.map((item, i) => (
              <ChatItem
                title={item.topic}
                time={new Date(item.lastUpdate).toLocaleString()}
                count={item.messages.length}
                key={item.id}
                id={item.id}
                index={i}
                selected={i === selectedIndex}
                onClick={() => {
                  router.push("/chat");
                  selectSession(i);
                }}
                onDelete={async () => {
                  if (
                    !props.narrow ||
                    (await showConfirm(Locale.Home.DeleteChat))
                  ) {
                    chatStore.deleteSession(i);
                  }
                }}
                narrow={props.narrow}
                mask={item.mask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export function ChatWTFElement(props: {
  chats: { id: string; title: string }[];
}) {
  return (
    <div className={styles2.chat}>
      <div className={styles2["chat-body"]}>
        <ChatWTF chats={props.chats} />
      </div>
    </div>
  );
}

export function ChatWTF(props: { chats: { id: string; title: string }[] }) {
  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
  };
  return (
    <SideBarContainer
      onDragStart={function (e: MouseEvent): void {
        throw new Error("Function not implemented.");
      }}
      shouldNarrow={false}
    >
      <SideBarBody
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            // Use Next.js router
          }
        }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="chat-list">
            {(provided) => (
              <div
                className={styles["chat-list"]}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {props.chats.map((item, index) => (
                  <ChatWTFItem
                    key={item.id}
                    title={item.title}
                    content={item.title}
                    id={item.id}
                    index={index}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </SideBarBody>
    </SideBarContainer>
  );
}

export function ChatWTFItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  content: string;
  id: string;
  index: number;
}) {
  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
  };
  return (
    <Draggable draggableId={`${props.id}`} index={props.index}>
      {(provided) => (
        <div
          className={`${styles["chat-item"]} ${styles["chat-item-selected"]}`}
          onClick={props.onClick}
          ref={(ele) => {
            provided.innerRef(ele);
          }}
          title={`${props.title}\n`}
        >
          <>
            <div className={styles["chat-item-title"]}>{props.title}</div>
            <div className={styles["chat-item-info"]}>
              <div className={styles["chat-item-count"]}>
                {Locale.ChatItem.ChatItemCount(3)}
                {/* {props.content} */}
              </div>
            </div>
          </>
        </div>
      )}
    </Draggable>
  );
}
