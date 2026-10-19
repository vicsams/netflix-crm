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
      <Button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="animate-gradient-pan fixed right-6 bottom-6 z-40 h-12 gap-2 rounded-full bg-linear-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-size-[200%_200%] px-5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition-[transform,box-shadow] hover:scale-105 hover:shadow-xl hover:shadow-fuchsia-500/40 motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:scale-100 max-sm:right-4 max-sm:bottom-4"
      >
        <Sparkles className="size-5" />
        Chat IA
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
