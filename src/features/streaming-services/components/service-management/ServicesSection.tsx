"use client";

import { useEffect, useState } from "react";

import CreateServiceDialog from "@/features/streaming-services/components/service-management/CreateServiceDialog";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/shared/lib/errors";
import { fetchServices } from "@/features/streaming-services/services/service-management/services";
import type { ServiceProps } from "@/features/streaming-services/types/service";
import ServiceActions from "@/features/streaming-services/components/service-management/ServiceActions";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/shared/components/ui/item";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ChevronDown } from "lucide-react";
import useIsMobile from "@/shared/hooks/useIsMobile";

export default function ServicesSection() {
  const [serviceIsOpen, setServiceIsOpen] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const isMobile = useIsMobile();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const handleServiceClick = () => {
    setServiceIsOpen(!serviceIsOpen);
  };

  useEffect(() => {
    if (isLoading || !data || data.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setCardsVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isLoading, data]);

  return (
    <div
      className={`col-span-2 flex max-h-91 flex-col overflow-y-scroll rounded-xl bg-white shadow-md transition-all duration-300 ease-in-out ${
        serviceIsOpen
          ? "max-sm:max-h-94"
          : "max-sm:max-h-17 max-sm:overflow-y-hidden"
      }`}
    >
      <div
        onClick={handleServiceClick}
        className="sticky top-0 z-10 flex items-center justify-between bg-white p-4"
      >
        <div className="flex items-center gap-1">
          <h2 className="text-lg font-bold">Servicios</h2>
          {isMobile && (
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 ${
                serviceIsOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <CreateServiceDialog />
        </div>
      </div>

      <div>
        {isLoading && (
          <div className="grid grid-cols-3 gap-4 px-4 pb-4 max-2xl:grid-cols-2 max-lg:grid-cols-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`service-skeleton-${index}`}
                className="col-span-1 rounded-xl border bg-white p-4"
              >
                <Skeleton className="mb-3 h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <div className="text-red-600">
            {getErrorMessage(error, "No se pudieron cargar los servicios")}
          </div>
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <div className="text-muted-foreground flex h-20 items-center justify-center text-sm">
            No se encontraron servicios
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div
            className={`grid grid-cols-3 gap-4 px-4 pb-4 transition-all duration-300 ease-in-out max-2xl:grid-cols-2 max-lg:grid-cols-1 ${serviceIsOpen ? "" : "transition-discrete max-sm:hidden max-sm:opacity-0"}`}
          >
            {data.map((service: ServiceProps) => {
              const textColor = service.textColor ?? "#111827";
              const backgroundColor = service.backgroundColor ?? "#f3f4f6";

              return (
                <Item
                  key={service.id}
                  variant="outline"
                  className={`col-span-1 items-center shadow-md transition-all duration-300 ease-out ${cardsVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                  style={{
                    backgroundColor,
                    // transitionDelay: `${index * 60}ms`,
                  }}
                >
                  <ItemContent>
                    <ItemTitle
                      style={{
                        color: textColor,
                      }}
                      className="text-lg font-bold"
                    >
                      {service.serviceName}
                    </ItemTitle>
                    <ItemDescription
                      style={{ color: textColor }}
                      className="text-md font-medium"
                    >
                      Precio: {(service.price / 100).toFixed(2)}{" "}
                      {service.currency}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ServiceActions service={service} />
                  </ItemActions>
                </Item>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
