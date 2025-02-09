"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useToast} from "@/hooks/use-toast";
import {FileCheck, Upload, X} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {uploadInvoice} from "@/lib/api";
import {redirect} from "next/navigation";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const {toast} = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const clearSelection = () => {
    setFile(null);
    // Reset the input value so the same file can be selected again
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'No file selected',
        variant: 'error',
        description: 'Please select a file to upload'
      })
      return
    }

    const form = e.currentTarget;
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      <div className="mt-4">
        <Button type="submit">Submit</Button>
      </div>
    </form>
  )
}
