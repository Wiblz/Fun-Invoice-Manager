import {
  ControllerRenderProps,
  DefaultValues,
  SubmitHandler,
  useForm,
} from "react-hook-form";
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
import { calculateFileHash } from "@/lib/utils";
import { checkFileExists } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { BaseInvoiceFormData } from "@/app/schemas/invoice";

interface InvoiceFormProps<T extends BaseInvoiceFormData> {
  schema: z.ZodSchema<T>;
  onSubmit: SubmitHandler<T>;
  defaultValues?: DefaultValues<T>;
  isEdit?: boolean;
}

export default function InvoiceForm<T extends BaseInvoiceFormData>({
  schema,
  onSubmit,
  defaultValues,
  isEdit = false,
}: InvoiceFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { control, reset, handleSubmit } = form;
  const [isUpdating, setUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleFileChange = async (
    field: ControllerRenderProps<T, "invoice">,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const hash = await calculateFileHash(file);
    const response = await checkFileExists(hash);
    if (response.error || !response.data) {
      toast({
        title: response.error?.message ?? "Error",
        variant: "error",
        description: response.error?.details ?? "An unexpected server response",
      });

      clearSelection(field);
      return;
    }

    const { invoice, fileExists } = response.data;
    if (fileExists) {
      toast({
        title: "File already exists",
        variant: "error",
        description: "This file has already been uploaded",
      });

      clearSelection(field);
      return;
    }

    if (invoice) {
      form.setValue("id", invoice.id);
      form.setValue("date", new Date(invoice.date).toISOString().split("T")[0]);
      form.setValue("amount", invoice.amount);
      form.setValue("paid", invoice.isPaid);
      form.setValue("reviewed", invoice.isReviewed);
      setUpdating(true);
    }

    field.onChange(file);
  };

  const clearSelection = (field: ControllerRenderProps<T, "invoice">) => {
    console.log(field, field.onChange);
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
        {!isEdit && (
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
                        onChange={(e) => handleFileChange(field, e)}
                      />
                      {file && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileCheck className="w-4 h-4 text-green-800" />
                          <span className="text-gray-600">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => clearSelection(field)}
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
                  <Input id="invoiceNumber" {...field} />
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
                  <Input id="date" type="date" {...field} />
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
                  <Input id="amount" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div />
          {/* Dummy */}

          <div className="flex flex-col space-y-2">
            <FormField
              name="paid"
              control={control}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormLabel htmlFor="paid" className="text-base">
                    Mark as Paid
                  </FormLabel>
                  <FormControl>
                    <Switch
                      id="paid"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                      className="data-[state=checked]:bg-green-800 data-[state=unchecked]:bg-red-700"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="reviewed"
              control={control}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormLabel htmlFor="reviewed" className="text-base">
                    Mark as Reviewed
                  </FormLabel>
                  <FormControl>
                    <Switch
                      id="reviewed"
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
          <Button type="submit">
            {isEdit || isUpdating ? "Update" : "Create"}
          </Button>
          {((isEdit && defaultValues?.fileExists === "false") ||
            isUpdating) && (
            <span className="text-sm text-gray-600">
              File for this invoice is missing, uploading it will fix this
            </span>
          )}
        </div>
      </form>
    </Form>
  );
}
