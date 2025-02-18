import { ColumnDef } from "@tanstack/table-core";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Clock, Euro, Eye, MoreHorizontal, Undo2 } from "lucide-react";
import { mutate } from "swr";
import Link from "next/link";
import { updateInvoice } from "@/lib/api";

export default interface Invoice {
  fileHash: string;
  originalFileName: string;
  id: string;
  date: string;
  amount: number;
  isPaid: boolean;
  isReviewed: boolean;
  fileExists: boolean;
}

export const columns: ColumnDef<Invoice>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "Preview",
    cell({ row, table }) {
      const { fileExists } = row.original;
      const { selectPreviewedInvoice } = table.options.meta ?? {};

      return (
        <div className="flex justify-center items-center">
          {fileExists ? (
            <Button
              variant="outline"
              title="Preview"
              className="px-1.5 py-1"
              onClick={() => selectPreviewedInvoice?.(row.original)}
            >
              <Eye />
            </Button>
          ) : (
            <span
              className="text-amber-600 [&_svg]:size-4 [&_svg]:shrink-0"
              title="Invoice file is missing"
            >
              <Eye />
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "originalFileName",
    header: "File Name",
    cell: ({ row }) => {
      const { fileHash, originalFileName } = row.original;
      return (
        <Link
          href={`/invoices/${fileHash}`}
          className="hover:underline"
          onClick={() => {
            mutate(
              `http://localhost:8080/api/v1/invoices/${fileHash}`,
              row.original,
              false,
            );
          }}
        >
          {originalFileName}
        </Link>
      );
    },
  },
  {
    accessorKey: "id",
    header: "Invoice Number",
    cell: ({ row }) =>
      row.original.id || <span className="text-zinc-600">unknown</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
  },
  {
    accessorKey: "isPaid",
    header: "Paid",
    cell: ({ row }) => (
      <span
        className={row.original.isPaid ? "text-green-700" : "text-amber-500"}
      >
        {row.original.isPaid ? <Check /> : <Clock />}
      </span>
    ),
  },
  {
    accessorKey: "isReviewed",
    header: "Reviewed",
    cell: ({ row }) => (
      <span
        className={row.original.isPaid ? "text-green-700" : "text-amber-500"}
      >
        {row.original.isPaid ? <Check /> : <Clock />}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const invoice = row.original;
      const mutateInvoices = table.options.meta?.mutateInvoices;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(invoice.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (!mutateInvoices) return;
                updateInvoice(mutateInvoices, {
                  fileHash: invoice.fileHash,
                  isPaid: !invoice.isPaid,
                });
              }}
            >
              {invoice.isPaid ? (
                <>
                  <Clock />
                  <span>Set as pending</span>
                </>
              ) : (
                <>
                  <Euro />
                  <span>Set as paid</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!mutateInvoices) return;
                updateInvoice(mutateInvoices, {
                  fileHash: invoice.fileHash,
                  isReviewed: !invoice.isReviewed,
                });
              }}
            >
              {invoice.isReviewed ? (
                <>
                  <Undo2 />
                  <span>Mark as unreviewed</span>
                </>
              ) : (
                <>
                  <Eye />
                  <span>Mark as reviewed</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
