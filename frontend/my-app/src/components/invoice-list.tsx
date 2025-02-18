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

export default function InvoiceList() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { data } = useInvoices();
  const invoices: Invoice[] = data ?? [];

  return (
    <div className="container mx-auto p-4 flex">
      {/* Invoice List Section */}
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

      {/* PDF Viewer Section */}
      {selectedInvoice && (
        <div className="w-1/3 shrink-0 grow-1 h-screen">
          <PdfViewer
            fileName={selectedInvoice.fileHash}
            onClose={() => {
              setSelectedInvoice(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
