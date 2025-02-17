"use client";

import { useInvoice, useInvoices } from "@/hooks/use-invoices";
import { EditInvoiceFormData, editInvoiceSchema } from "@/app/schemas/invoice";
import InvoiceForm from "@/components/InvoiceForm";
import { updateInvoice } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EditForm({ hash }: { hash: string }) {
  const { data: invoice, isLoading } = useInvoice(hash);
  const { mutate } = useInvoices();

  const onSubmit = async (data: EditInvoiceFormData) => {
    try {
      updateInvoice(mutate, {
        ...data,
        fileHash: hash,
      });
    } catch {
      toast({
        title: "Error",
        variant: "error",
        description: "Failed to update invoice",
      });

      return;
    }

    toast({
      title: "Success",
      description: "Invoice updated successfully",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            schema={editInvoiceSchema}
            onSubmit={onSubmit}
            invoice={invoice}
          />
        </CardContent>
      </Card>
    </div>
  );
}
