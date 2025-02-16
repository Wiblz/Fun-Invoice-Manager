"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CreateInvoiceFormData,
  createInvoiceSchema,
} from "@/app/schemas/invoice";
import { checkFileExists, uploadInvoice } from "@/lib/api";
import { redirect } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import { toast } from "@/hooks/use-toast";
import { calculateFileHash } from "@/lib/utils";
import { useState } from "react";
import Invoice from "@/app/models/invoice";

export default function UploadPage() {
  const [invoice, setInvoice] = useState<Invoice>({
    id: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    isPaid: false,
    isReviewed: false,
    fileHash: "",
    originalFileName: "",
    fileExists: false,
  });

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

  const onFileChange = async (file: File | undefined) => {
    if (!file) return false;

    const hash = await calculateFileHash(file);
    const response = await checkFileExists(hash);
    if (response.error || !response.data) {
      toast({
        title: response.error?.message ?? "Error",
        variant: "error",
        description: response.error?.details ?? "An unexpected server response",
      });

      return false;
    }

    const { fileExists } = response.data;

    if (fileExists) {
      toast({
        title: "File already exists",
        variant: "error",
        description: "This file has already been uploaded",
      });

      return false;
    }

    if (response.data.invoice) {
      setInvoice(response.data.invoice);
    }

    return true;
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <h1 className="text-2xl font-bold">Upload Invoice</h1>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            schema={createInvoiceSchema}
            onSubmit={onSubmit}
            onFileChange={onFileChange}
            invoice={invoice}
          />
        </CardContent>
      </Card>
    </div>
  );
}
