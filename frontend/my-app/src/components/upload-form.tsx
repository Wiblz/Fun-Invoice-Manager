"use client";

import {useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {useToast} from "@/hooks/use-toast";
import {FileCheck, Upload, X} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {checkFileExists, uploadInvoice} from "@/lib/api";
import {redirect} from "next/navigation";
import {calculateFileHash} from "@/lib/utils";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [updating, setUpdating] = useState(false)
  const formRef = useRef<HTMLFormElement>(null);
  const {toast} = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = formRef.current;
    if (!form) return;

    const file = e.target.files?.[0];
    if (file) {
      const hash = await calculateFileHash(file);
      console.log(hash);
      const response = await checkFileExists(hash);
      if (response.error || !response.data) {
        toast({
          title: response.error?.message ?? 'Error',
          variant: 'error',
          description: response.error?.details ?? 'An unexpected server response',
        })

        clearSelection();
        return
      }

      const {invoice, fileExists} = response.data;
      if (fileExists) {
        toast({
          title: 'File already exists',
          variant: 'error',
          description: 'This file has already been uploaded'
        })

        clearSelection();
        return
      }

      if (invoice) {
        form.invoiceNumber.value = invoice.id;
        form.date.value = new Date(invoice.date).toISOString().split('T')[0];
        form.amount.value = invoice.amount;
        form.paid.checked = invoice.isPaid;
        form.reviewed.checked = invoice.isReviewed;
        setUpdating(true);
      }
      setFile(file);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setUpdating(false);
    // Reset the input value so the same file can be selected again
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    if (!file) {
      toast({
        title: 'No file selected',
        variant: 'error',
        description: 'Please select a file to upload'
      })
      return
    }

    const formData = new FormData(form);
    formData.append('invoice', file);

    const response = await uploadInvoice(formData);
    if (response.error) {
      toast({
        title: response.error.message,
        variant: 'error',
        description: response.error.details
      })
    } else {
      redirect("/");
    }
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex flex-col gap-4">
      <div className="space-y-4">
        <Button
          type="button"
          className="flex items-center gap-2"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <Upload className="w-4 h-4"/>
          Upload Invoice
        </Button>

        <input
          id="fileInput"
          type="file"
          name="invoice"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {file && (
          <div className="flex items-center gap-2 text-sm">
            <FileCheck className="w-4 h-4 text-green-800"/>
            <span className="text-gray-600">{file.name}</span>
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-gray-500"/>
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="invoiceNumber">Invoice Number</label>
          <Input id="invoiceNumber" name="id"/>
        </div>
        <div>
          <label htmlFor="date">Date</label>
          <Input id="date" type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]}/>
        </div>
        <div>
          <label htmlFor="amount">Amount</label>
          <Input id="amount" type="number" name="amount"/>
        </div>
        <div/>
        {/* Dummy */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="paid" className="text-base">
              Mark as Paid
            </Label>
            <Switch id="paid" name="isPaid" value={"false"}
                    className="data-[state=checked]:bg-green-800 data-[state=unchecked]:bg-red-700"/>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="reviewed" className="text-base">
              Mark as Reviewed
            </Label>
            <Switch id="reviewed" name="isReviewed" value={"false"}
                    className="data-[state=checked]:bg-green-800 data-[state=unchecked]:bg-red-700"/>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <Button type="submit">{updating ? 'Update' : 'Create'}</Button>
        {updating && (
          <span className="text-sm text-gray-600">File for this invoice is missing, uploading it will fix this</span>
        )}
      </div>
    </form>
  )
}
