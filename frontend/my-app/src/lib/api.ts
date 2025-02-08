import type Invoice from "@/app/models/invoice";
import {KeyedMutator} from "swr";
import type {SingleFieldUpdate} from "@/lib/utils";

async function sendRequest(url: string, {arg}: { arg: Record<string, unknown> }) {
  return fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(arg)
  }).then(res => res.json());
}

export const setInvoicePaymentStatus = (filename: string, isPaid: boolean) => {
  return () => sendRequest(`http://localhost:8080/api/v1/invoice/${filename}/payment-status`, {arg: {isPaid}});
}

export const setInvoiceReviewStatus = (filename: string, isReviewed: boolean) => {
  return () => sendRequest(`http://localhost:8080/api/v1/invoice/${filename}/review-status`, {arg: {isReviewed}});
}

export const updateInvoice = (mutate: KeyedMutator<Invoice[]>, filename: string, update: SingleFieldUpdate<Invoice>) => {
  let mutatingFunction;
  switch (Object.keys(update)[0]) {
    case 'isPaid':
      mutatingFunction = setInvoicePaymentStatus(filename, update.isPaid as boolean);
      break;
    case 'isReviewed':
      mutatingFunction = setInvoiceReviewStatus(filename, update.isReviewed as boolean);
      break;
    default:
      throw new Error('Invalid update key');
  }

  mutate(mutatingFunction, {
    populateCache: (updatedInvoice: Invoice, invoices: Invoice[] | undefined): Invoice[] => {
      if (!invoices) return [];
      return invoices.map((invoice: Invoice) => invoice.fileHash === updatedInvoice.fileHash ? updatedInvoice : invoice);
    },
    revalidate: false
  });
}
