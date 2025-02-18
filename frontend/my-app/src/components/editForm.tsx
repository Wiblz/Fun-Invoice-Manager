"use client";

import { useInvoice, useInvoices } from "@/hooks/use-invoices";
import { EditInvoiceFormData, editInvoiceSchema } from "@/app/schemas/invoice";
import InvoiceForm from "@/components/InvoiceForm";
import { updateInvoice } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import PdfViewer from "@/components/pdf-viewer";
import { useState } from "react";

export default function EditForm({ hash }: { hash: string }) {
  const { data: invoice } = useInvoice(hash);
  const { mutate } = useInvoices();
  const [previewActive, setPreviewActive] = useState(false);
  const fileHash = invoice?.fileHash;

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
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={fileHash && previewActive ? 66.7 : 100}>
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
        </ResizablePanel>

        {fileHash && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={33.3}>
              <PdfViewer
                fileName={fileHash}
                onClose={() => {
                  setPreviewActive(false);
                }}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
