import axiosInstance from "@/shared/lib/axiosInstance";
import type { SalesMonth } from "@/features/sales/types/sale";

export async function fetchSales(month: string): Promise<SalesMonth> {
  const response = await axiosInstance.get("/sales", { params: { month } });
  return response.data;
}

export async function voidSale(id: string) {
  const response = await axiosInstance.patch(`/sales/${id}/void`);
  return response.data;
}
