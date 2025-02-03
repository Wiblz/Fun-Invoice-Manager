"use server";

import {revalidatePath} from "next/cache";

export async function uploadInvoice(prevState: any, formData: FormData): Promise<{ message: string, details?: string }> {
  formData.set('isPaid', formData.get('isPaid') === 'on' ? 'true' : 'false');
  formData.set('isReviewed', formData.get('isReviewed') === 'on' ? 'true' : 'false');

  const response = await fetch('http://localhost:8080/api/v1/invoice/upload', {
    method: 'POST',
    body: formData
  })

  if (response.status === 200) {
    return {message: "The invoice has been uploaded successfully"};
  } else if (response.status === 409) {
    return {message: "This invoice has already been uploaded"};
  } else {
    return {message: "Upload failed", details: await response.text()};
  }
}

export async function setInvoicePaymentStatus(filename: string, isPaid: boolean): Promise<any> {
  const response = await fetch(`http://localhost:8080/api/v1/invoice/${filename}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({isPaid})
  })

  revalidatePath("/");
}

export async function setInvoiceReviewStatus(filename: string, isReviewed: boolean): Promise<any> {
  const response = await fetch(`http://localhost:8080/api/v1/invoice/${filename}/review-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({isReviewed})
  })

  revalidatePath("/");
}
