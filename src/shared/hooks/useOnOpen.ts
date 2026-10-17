import { useEffect, useEffectEvent } from "react";

// Runs `callback` each time `open` turns true. Dialogs use it to reset their
// form on open, so values from a cancelled attempt never come back, without
// also resetting when the data behind them refetches while they are open
export default function useOnOpen(open: boolean, callback: () => void) {
  const onOpen = useEffectEvent(callback);

  useEffect(() => {
    if (open) onOpen();
  }, [open]);
}
