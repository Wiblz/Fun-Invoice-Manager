"use client";

import {useActionState, useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {useToast} from "@/hooks/use-toast";
import {FileCheck, Loader2, Upload, X} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import Form from "next/form";
import {uploadInvoice} from "@/app/actions";
import {Label} from "@/components/ui/label";

export default function UploadForm() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [state, formAction, _] = useActionState(uploadInvoice, {message: ''})
  const {toast} = useToast()

  useEffect(() => {
    console.log("state", state);
    if (!state) return
    toast({
      title: state.message,
      variant: 'destructive',
      description: state?.details
    })
  }, [state]);

  const handleFileChange = (e) => {
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

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <div className="space-y-4">
        <Button
          type="button"
          disabled={uploading}
          className="flex items-center gap-2"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin"/>
          ) : (
            <Upload className="w-4 h-4"/>
          )}
          {uploading ? 'Uploading...' : 'Upload Invoice'}
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

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress}/>
            <p className="text-sm text-gray-500">
              {Math.round(progress)}% uploaded
            </p>
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
            <Switch id="paid" name="isPaid"
                    className="data-[state=checked]:bg-green-800 data-[state=unchecked]:bg-red-700"/>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="reviewed" className="text-base">
              Mark as Reviewed
            </Label>
            <Switch id="reviewed" name="isReviewed"
                    className="data-[state=checked]:bg-green-800 data-[state=unchecked]:bg-red-700"/>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Button type="submit">Submit</Button>
      </div>
    </Form>
  )
}
