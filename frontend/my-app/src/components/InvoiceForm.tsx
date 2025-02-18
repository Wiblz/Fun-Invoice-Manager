// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ControllerRenderProps, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileCheck, Upload, X } from "lucide-react";
import { Input } from "./ui/input";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { BaseInvoiceFormData } from "@/app/schemas/invoice";
import type Invoice from "@/app/models/invoice";

interface InvoiceFormProps<T extends BaseInvoiceFormData> {
  schema: z.ZodSchema<T>;
  onSubmit: SubmitHandler<T>;
  invoice: Invoice | null;
  onFileChange?: (file: File | undefined) => Promise<boolean>;
}

const placeholderInvoice: Invoice = {
  id: "",
  date: new Date().toISOString().split("T")[0],
  amount: 0,
  isPaid: false,
  isReviewed: false,
  fileHash: "",
  originalFileName: "",
  fileExists: false,
};

export default function InvoiceForm<T extends BaseInvoiceFormData>({
  schema,
  onSubmit,
  invoice,
  onFileChange,
}: InvoiceFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: invoice ?? placeholderInvoice,
  });

  const { control, reset, handleSubmit } = form;
  const [, setUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // iterate over the keys of T and reset them individually, except for the file field
    for (const key in form.getValues()) {
      if (key === "invoice") continue;
      if (invoice?.[key as keyof Invoice]) {
        form.setValue(key as keyof T, invoice[key as keyof Invoice]);
      } else {
        form.resetField(key as keyof T);
      }
    }
  }, [invoice, reset]);

  const clearSelection = (field: ControllerRenderProps<T, "invoice">) => {
    field.onChange(null);
    setUpdating(false);
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {onFileChange && (
          <FormField
            name="invoice"
            control={control}
            render={({ field }) => {
              const file = form.watch("invoice");

              return (
                <FormItem>
                  <FormControl>
                    <div className="space-y-4">
                      <Button
                        type="button"
                        className="flex items-center gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4" />
                        Upload Invoice
                      </Button>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (!onFileChange) return;
                          const file = e.target.files?.[0];
                          onFileChange(file).then((success) => {
                            if (success) {
                              field.onChange(file);
                            } else {
                              clearSelection(field);
                            }
                          });
                        }}
                      />
                      {file && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileCheck className="w-4 h-4 text-green-800" />
                          <span className="text-gray-600">
                            {(file as File).name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onFileChange();
                              clearSelection(field);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                            aria-label="Clear selection"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="id"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="date"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="amount"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div />
          {/* Dummy */}

          <div className="flex flex-col space-y-2">
            <FormField
              name="isPaid"
              control={control}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormLabel className="text-base">Mark as Paid</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                      className="data-[state=checked]:bg-green-800 data-[state=unchecked]:bg-red-700"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="isReviewed"
              control={control}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormLabel className="text-base">Mark as Reviewed</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                      className="data-[state=checked]:bg-green-800 data-[state=unchecked]:bg-red-700"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Button type="submit">{invoice ? "Update" : "Create"}</Button>
          {invoice && onFileChange && (
            <span className="text-sm text-gray-600">
              File for this invoice is missing, uploading it will fix this
            </span>
          )}
        </div>
      </form>
    </Form>
  );
}
