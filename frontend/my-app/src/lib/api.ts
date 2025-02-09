import type Invoice from "@/app/models/invoice";
import {KeyedMutator} from "swr";
import type {SingleFieldUpdate} from "@/lib/utils";

export enum ErrorCode {
  INVOICE_ALREADY_EXISTS = 'INVOICE_ALREADY_EXISTS',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface APIResponse<T> {
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: string;
  };
}

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

export async function uploadInvoice(formData: FormData): Promise<APIResponse<null>> {
  try {
    const response = await fetch('http://localhost:8080/api/v1/invoice/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      switch (response.status) {
        case 409:
          return {
            error: {
              code: ErrorCode.INVOICE_ALREADY_EXISTS,
              message: "Upload failed",
              details: "Invoice already exists"
            }
          };
        default:
          return {
            error: {
              code: ErrorCode.SERVER_ERROR,
              message: "Upload failed",
              details: await response.text()
            }
          };
      }
    }

    return {data: null};
  } catch (error) {
    return {
      error: {
        code: ErrorCode.SERVER_ERROR,
        message: "Upload failed",
        details: String(error)
      }
    };
  }
}

export async function checkFileExists(hash: string): Promise<APIResponse<boolean>> {
  try {
    const response = await fetch(`http://localhost:8080/api/v1/invoice/${hash}/exists`);

    if (!response.ok) {
      return {
        error: {
          code: ErrorCode.SERVER_ERROR,
          message: "Check file exists failed",
          details: await response.text()
        }
      };
    }

    return {data: await response.json()};
  } catch (error) {
    return {
      error: {
        code: ErrorCode.SERVER_ERROR,
        message: "Check file exists failed",
        details: String(error)
      }
    };
  }
}
