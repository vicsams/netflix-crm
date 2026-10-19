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
      {/* White with gradient text; on hover the gradient fades in behind it.
          Backgrounds can't animate between white and a gradient, so the
          gradient is its own layer whose opacity transitions. hover:bg-white
          replaces the Button's dark hover color, which used to flash while
          fading back after the cursor left */}
      <Button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="group fixed right-6 bottom-6 isolate z-40 h-12 gap-2 overflow-hidden rounded-full border border-fuchsia-200 bg-white px-5 text-sm font-semibold shadow-lg shadow-fuchsia-500/30 transition-colors duration-300 ease-out hover:border-transparent hover:bg-white max-sm:right-4 max-sm:bottom-4"
      >
        <span
          aria-hidden
          className="animate-gradient-pan absolute inset-0 -z-10 bg-linear-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-size-[200%_200%] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:animate-none"
        />
        {/* The icon is a stroke, which can't use the text's clipped gradient:
            it gets the gradient as an SVG paint, and a white copy fades in
            over it on hover (a paint can't animate into a color) */}
        <svg aria-hidden className="absolute size-0">
          <defs>
            <linearGradient id="chat-ia-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-violet-600)" />
              <stop offset="50%" stopColor="var(--color-fuchsia-500)" />
              <stop offset="100%" stopColor="var(--color-orange-400)" />
            </linearGradient>
          </defs>
        </svg>
        <span className="relative size-5">
          <Sparkles
            stroke="url(#chat-ia-gradient)"
            className="absolute inset-0 size-5 transition-opacity duration-300 ease-out group-hover:opacity-0"
          />
          <Sparkles className="absolute inset-0 size-5 text-white opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />
        </span>
        {/* Transparent text shows the clipped gradient; fading the color to
            white turns it white smoothly */}
        <span className="bg-linear-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent transition-colors duration-300 ease-out group-hover:text-white">
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
