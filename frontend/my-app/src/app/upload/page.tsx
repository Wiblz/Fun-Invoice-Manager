"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CreateInvoiceFormData,
  createInvoiceSchema,
} from "@/app/schemas/invoice";
import { uploadInvoice } from "@/lib/api";
import { redirect } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import { toast } from "@/hooks/use-toast";

export default function UploadPage() {
  const onSubmit = async (data: CreateInvoiceFormData) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      // FormData.append automatically converts non-string values to strings at runtime: https://developer.mozilla.org/en-US/docs/Web/API/FormData/append#value
      formData.append(key, value as string | Blob);
    }

    const response = await uploadInvoice(formData);
    if (response.error) {
      toast({
        title: response.error.message,
        variant: "error",
        description: response.error.details,
      });
    } else {
      redirect("/");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <h1 className="text-2xl font-bold">Upload Invoice</h1>
        </CardHeader>
        <CardContent>
          <InvoiceForm schema={createInvoiceSchema} onSubmit={onSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
