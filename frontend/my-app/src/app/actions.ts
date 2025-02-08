"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";

interface ActionResult {
  message: string;
  details: string;
}

export async function uploadInvoice(prevState: ActionResult | Promise<ActionResult | null> | null, formData: FormData): Promise<ActionResult> {
  formData.set('isPaid', formData.get('isPaid') === 'on' ? 'true' : 'false');
  formData.set('isReviewed', formData.get('isReviewed') === 'on' ? 'true' : 'false');

  const response = await fetch('http://localhost:8080/api/v1/invoice/upload', {
    method: 'POST',
    body: formData
  })

  if (response.status === 200) {
    redirect("/");
  } else if (response.status === 409) {
    return {message: "Upload failed", details: "Invoice already exists"};
  } else {
    return {message: "Upload failed", details: await response.text()};
  }
}

export async function setInvoicePaymentStatus(filename: string, isPaid: boolean){
  await fetch(`http://localhost:8080/api/v1/invoice/${filename}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({isPaid})
  })

  revalidatePath("/");
}

export async function setInvoiceReviewStatus(filename: string, isReviewed: boolean) {
  await fetch(`http://localhost:8080/api/v1/invoice/${filename}/review-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({isReviewed})
  })

  revalidatePath("/");
}
