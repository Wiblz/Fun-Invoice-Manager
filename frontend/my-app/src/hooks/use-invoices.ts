import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useInvoices() {
  return useSWR("http://localhost:8080/api/v1/invoices", fetcher);
}

export function useInvoice(hash: string) {
  return useSWR(`http://localhost:8080/api/v1/invoice/${hash}`, fetcher, {
    fallbackData: {},
  });
}
