import { useState } from "react";
import ActiveAccountActions from "@/features/streaming-services/components/active-accounts/ActiveAccountActions";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { copyToClipboard } from "@/shared/lib/clipboard";
import { formatDate } from "@/shared/lib/date";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
} from "@/shared/components/ui/item";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import UpdateScreenDialog from "./UpdateScreenDialog";
import type { ScreenProps } from "@/features/streaming-services/types/screen";
import type { ActiveAccountProps } from "@/features/streaming-services/types/activeAccount";
import { ChevronDown, Copy } from "lucide-react";
import ColorContrastChecker from "color-contrast-checker";
import useIsMobile from "@/shared/hooks/useIsMobile";

const contrastChecker = new ColorContrastChecker();

function resolveServiceTextColor(activeAccount: ActiveAccountProps): string {
  const service = activeAccount.service;

  if (!service?.textColor) {
    return "inherit";
  }

  try {
    const textLum = contrastChecker.hexToLuminance(service.textColor);
    const whiteLum = contrastChecker.hexToLuminance("#ffffff");
    const contrastRatio = contrastChecker.getContrastRatio(textLum, whiteLum);

    if (contrastRatio >= 4.5) {
      return service.textColor;
    }

    return service.backgroundColor ?? service.textColor;
  } catch {
    return service.textColor;
  }
}

function CopyButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground size-6 shrink-0"
    >
      <Copy className="size-3.5" />
    </Button>
  );
}

export default function ActiveAccountCard({
  activeAccount,
}: {
  activeAccount: ActiveAccountProps;
}) {
  const [showScreens, setShowScreens] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<ScreenProps | null>(
    null,
  );
  const serviceTextColor = resolveServiceTextColor(activeAccount);
  const isMobile = useIsMobile();

  const handleCopyProfile = (e: React.MouseEvent, screen: ScreenProps) => {
    e.stopPropagation();
    const textToCopy = `Correo electrónico: ${activeAccount.email}
Contraseña: ${activeAccount.password}
Perfil: ${screen.profileName}
PIN: ${screen.profilePIN}`;
    copyToClipboard(textToCopy, "Datos del perfil copiados");
  };

  return (
    <Item variant="outline" className="col-span-1 items-start">
      <ItemContent>
        <div className="flex w-full flex-col justify-between sm:flex-row">
          <div>
            {activeAccount.service?.serviceName ? (
              <p
                className="pb-2 text-lg font-semibold"
                style={{ color: serviceTextColor }}
              >
                {activeAccount.service.serviceName}
              </p>
            ) : (
              <p>Sin servicio</p>
            )}
            <ItemDescription className="flex items-center gap-1 text-black">
              <span className="font-semibold">Correo:</span>
              <span className="truncate">{activeAccount.email}</span>
              <CopyButton
                label="Copiar correo"
                onClick={() =>
                  copyToClipboard(activeAccount.email, "Correo copiado")
                }
              />
            </ItemDescription>
            <ItemDescription className="flex items-center gap-1 text-black">
              <span className="font-semibold">Contraseña:</span>
              <span className="truncate">{activeAccount.password}</span>
              <CopyButton
                label="Copiar contraseña"
                onClick={() =>
                  copyToClipboard(activeAccount.password, "Contraseña copiada")
                }
              />
            </ItemDescription>
            <ItemDescription className="text-black">
              <span className="font-semibold">Expiración:</span>{" "}
              {formatDate(new Date(activeAccount.expirationDate).toISOString())}
            </ItemDescription>
          </div>
        </div>

        {activeAccount.screens && activeAccount.screens.length > 0 && (
          <div className="text-sm">
            <Button
              variant="link"
              size="sm"
              className="flex h-8 cursor-pointer items-center gap-1 px-0! text-neutral-500 hover:text-blue-500"
              onClick={() => setShowScreens(!showScreens)}
            >
              <span>
                {showScreens ? "Ocultar" : "Mostrar"} pantallas (
                {activeAccount.screens.length}/5)
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${showScreens ? "rotate-180" : ""}`}
              />
            </Button>

            <div
              className={`grid w-full grid-cols-1 gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
                showScreens ? "mt-2 max-h-70 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {isMobile
                ? activeAccount.screens.map((screen) => (
                    <div key={screen.id}>
                      <div>
                        <div
                          className="group flex cursor-pointer items-center justify-between gap-2 rounded-full border pl-4 font-medium text-neutral-600 transition-colors"
                          onClick={() =>
                            setSelectedScreen({
                              ...screen,
                              activeAccountId: activeAccount.id,
                            })
                          }
                        >
                          <div className="flex flex-col pr-2">
                            <div className="flex h-4 items-center gap-2 text-left text-sm">
                              <span>{screen.profileName}</span>
                              <Separator orientation="vertical" />
                              <span className="text-left text-xs text-neutral-400">
                                PIN: {screen.profilePIN}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Copiar datos del perfil ${screen.profileName}`}
                            className="h-7 w-7 shrink-0 rounded-full transition-opacity group-hover:opacity-100 hover:bg-neutral-100!"
                            onClick={(e) => {
                              handleCopyProfile(e, {
                                ...screen,
                                activeAccountId: activeAccount.id,
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                : activeAccount.screens.map((screen) => (
                    <Tooltip key={screen.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="group flex cursor-pointer items-center justify-between gap-2 rounded-full border pl-4 font-medium text-neutral-600 transition-colors"
                          onClick={() =>
                            setSelectedScreen({
                              ...screen,
                              activeAccountId: activeAccount.id,
                            })
                          }
                        >
                          <div className="flex flex-col pr-2">
                            <div className="flex h-4 items-center gap-2 text-left text-sm">
                              <span>{screen.profileName}</span>
                              <Separator orientation="vertical" />
                              <span className="text-left text-xs text-neutral-400">
                                PIN: {screen.profilePIN}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Copiar datos del perfil ${screen.profileName}`}
                            className="h-7 w-7 shrink-0 rounded-full transition-opacity group-hover:opacity-100 hover:bg-neutral-100!"
                            onClick={(e) => {
                              handleCopyProfile(e, {
                                ...screen,
                                activeAccountId: activeAccount.id,
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Actualizar &quot;{screen.profileName}&quot;</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
            </div>
          </div>
        )}
        {(!activeAccount.screens || activeAccount.screens.length === 0) && (
          <div className="mt-2 text-sm text-neutral-400">
            Sin pantallas registradas
          </div>
        )}
      </ItemContent>
      <ItemActions className="flex shrink-0 flex-col gap-2">
        <ActiveAccountActions activeAccount={activeAccount} />
      </ItemActions>

      {selectedScreen && (
        <UpdateScreenDialog
          screen={selectedScreen}
          open={!!selectedScreen}
          onOpenChange={(isOpen) => !isOpen && setSelectedScreen(null)}
        />
      )}
    </Item>
  );
}
