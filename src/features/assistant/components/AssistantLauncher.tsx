"use client";

import { useState } from "react";
import { generateId } from "ai";
import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import useIsMobile from "@/shared/hooks/useIsMobile";
import AssistantPanel, {
  type ActiveChat,
} from "@/features/assistant/components/AssistantPanel";

const newChat = (): ActiveChat => ({ id: generateId(), isNew: true });

// Floating button that opens the assistant: a side panel on desktop, a bottom
// drawer on phones. The active chat lives here, outside the panel (which
// unmounts when closed), so reopening returns to the same conversation
export default function AssistantLauncher() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeChat, setActiveChat] = useState<ActiveChat>(newChat);
  // A new chat that already sent a message: it's saved on the server, so
  // after closing, reopen it by loading it rather than starting empty
  const [newChatStarted, setNewChatStarted] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && activeChat.isNew && newChatStarted) {
      setActiveChat((chat) => ({ ...chat, isNew: false }));
      setNewChatStarted(false);
    }
  };

  const startNewChat = () => {
    setActiveChat(newChat());
    setNewChatStarted(false);
    setShowHistory(false);
  };

  const panel = (
    <AssistantPanel
      activeChat={activeChat}
      showHistory={showHistory}
      onToggleHistory={() => setShowHistory((value) => !value)}
      onNewChat={startNewChat}
      onOpenChat={(id) => {
        setActiveChat({ id, isNew: false });
        setNewChatStarted(false);
        setShowHistory(false);
      }}
      onChatSaved={() => setNewChatStarted(true)}
      onChatDeleted={(id) => {
        if (id === activeChat.id) {
          setActiveChat(newChat());
          setNewChatStarted(false);
        }
      }}
    />
  );

  const title = "Asistente";
  const description = "Consulta tus clientes, suscripciones y ganancias.";

  return (
    <>
      {/* White with gradient text; on hover the gradient fills the button */}
      <Button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="group hover:animate-gradient-pan fixed right-6 bottom-6 z-40 h-12 gap-2 rounded-full border border-fuchsia-200 bg-white bg-size-[200%_200%] px-5 text-sm font-semibold shadow-lg shadow-fuchsia-500/30 hover:border-transparent hover:bg-linear-to-r hover:from-violet-600 hover:via-fuchsia-500 hover:to-orange-400 motion-reduce:hover:animate-none max-sm:right-4 max-sm:bottom-4"
      >
        {/* The icon is drawn with its stroke, which can't use the text's
            clipped gradient, so it gets the same gradient as an SVG paint */}
        <svg aria-hidden className="absolute size-0">
          <defs>
            <linearGradient id="chat-ia-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-violet-600)" />
              <stop offset="50%" stopColor="var(--color-fuchsia-500)" />
              <stop offset="100%" stopColor="var(--color-orange-400)" />
            </linearGradient>
          </defs>
        </svg>
        <Sparkles
          stroke="url(#chat-ia-gradient)"
          className="size-5 group-hover:stroke-white"
        />
        <span className="bg-linear-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent group-hover:bg-none group-hover:text-white">
          Chat IA
        </span>
      </Button>

      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent className="h-[90dvh] data-[vaul-drawer-direction=bottom]:max-h-[90dvh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            {panel}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
            <SheetHeader className="sr-only">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            {panel}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
