"use client";

import type Invoice from "@/app/models/invoice";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import PdfViewer from "@/components/pdf-viewer";
import { useState } from "react";
import { useInvoices } from "@/hooks/use-invoices";
import InvoiceTable from "@/components/invoiceTable";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function InvoiceList() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { data } = useInvoices();
  const invoices: Invoice[] = data ?? [];

  return (
    <div className="container h-screen p-4 flex mx-auto">
      <ResizablePanelGroup direction="horizontal">
        {/* Invoice List Section */}
        <ResizablePanel defaultSize={selectedInvoice ? 66.7 : 100}>
          <div className="flex-1">
            <Card className="mb-8">
              <CardHeader>
                <h1 className="text-2xl font-bold">Invoice Manager</h1>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Link href="/upload">
                    <Button className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Invoice
                    </Button>
                  </Link>
                </div>
                <InvoiceTable
                  invoices={invoices}
                  onPreview={(invoice) => {
                    if (
                      selectedInvoice &&
                      selectedInvoice?.fileHash === invoice.fileHash
                    ) {
                      setSelectedInvoice(null);
                    } else {
                      setSelectedInvoice(invoice);
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>

        {/* PDF Viewer Section */}
        {selectedInvoice && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={33.3}>
              <PdfViewer
                fileName={selectedInvoice.fileHash}
                onClose={() => {
                  setSelectedInvoice(null);
                }}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
