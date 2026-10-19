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
      onClose={() => handleOpenChange(false)}
    />
  );

  const title = "Asistente";
  const description = "Consulta tus clientes, suscripciones y ganancias.";

  return (
    <>
      {/* Cream with brand-gradient text; on hover the gradient fades in behind
          it. Backgrounds can't animate between a color and a gradient, so the
          gradient is its own layer whose opacity transitions. The cream hover
          background replaces the Button's dark hover color, which used to
          flash while fading back after the cursor left */}
      <Button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="group border-lumina-purple/30 bg-lumina-cream shadow-lumina-purple/40 hover:bg-lumina-cream fixed right-6 bottom-6 isolate z-40 h-12 gap-2 overflow-hidden rounded-full border px-5 text-sm font-semibold shadow-lg transition-colors duration-300 ease-out hover:border-transparent max-sm:right-4 max-sm:bottom-4"
      >
        <span
          aria-hidden
          className="animate-gradient-pan from-lumina-purple via-lumina-crimson to-lumina-purple absolute inset-0 -z-10 bg-linear-to-r bg-size-[200%_200%] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:animate-none"
        />
        {/* The icon is a stroke, which can't use the text's clipped gradient:
            it gets the gradient as an SVG paint, and a cream copy fades in
            over it on hover (a paint can't animate into a color) */}
        <svg aria-hidden className="absolute size-0">
          <defs>
            <linearGradient id="chat-ia-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--lumina-purple)" />
              <stop offset="50%" stopColor="var(--lumina-crimson)" />
              <stop offset="100%" stopColor="var(--lumina-purple)" />
            </linearGradient>
          </defs>
        </svg>
        <span className="relative size-5">
          <Sparkles
            stroke="url(#chat-ia-gradient)"
            className="absolute inset-0 size-5 transition-opacity duration-300 ease-out group-hover:opacity-0"
          />
          <Sparkles className="text-lumina-cream absolute inset-0 size-5 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />
        </span>
        {/* Transparent text shows the clipped gradient; fading the color to
            cream turns it cream smoothly */}
        <span className="from-lumina-purple via-lumina-crimson to-lumina-purple group-hover:text-lumina-cream bg-linear-to-r bg-clip-text text-transparent transition-colors duration-300 ease-out">
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
          {/* The close button lives in the panel header with the other actions */}
          <SheetContent
            showCloseButton={false}
            className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
          >
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
