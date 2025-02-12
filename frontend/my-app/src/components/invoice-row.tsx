import {TableCell, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import Invoice from "@/app/models/invoice";
import {Checkbox} from "@/components/ui/checkbox";
import {useInvoices} from "@/hooks/use-invoices";
import {updateInvoice} from "@/lib/api";
import {CircleAlert} from "lucide-react";
import Link from "next/link";
import {mutate} from "swr";

export default function InvoiceRow({invoice, onView}: {
  invoice: Invoice,
  onView: () => void
}) {
  const {mutate: mutateInvoices} = useInvoices();

  return (
    <TableRow className={invoice.isReviewed ? '' : 'bg-zinc-200'}>
      <TableCell>
        <Checkbox checked={invoice.isReviewed} onCheckedChange={async () => {
          updateInvoice(mutateInvoices, {fileHash: invoice.fileHash, isReviewed: !invoice.isReviewed});
        }}/>
      </TableCell>
      <TableCell>
        <Link href={`/invoices/${invoice.fileHash}`}
              onClick={() => {
                mutate(`http://localhost:8080/api/v1/invoices/${invoice.fileHash}`, invoice, false);
              }}>
          {invoice.id || <span className="text-zinc-600">unknown</span>}
        </Link>
      </TableCell>
      <TableCell>{invoice.date}</TableCell>
      <TableCell>
        {invoice.fileExists ? (
          <a href="#" onClick={onView} className="text-blue-600 hover:underline">
            {invoice.originalFileName}
          </a>
        ) : (
          <span className="text-zinc-600 inline-flex items-center gap-1 select-none" title="File is missing">
            <CircleAlert className="inline w-3.5 h-3.5"/>
            {invoice.originalFileName}
          </span>
        )}
      </TableCell>
      <TableCell>{invoice.amount}</TableCell>
      <TableCell
        className={invoice.isPaid ? 'text-green-700' : 'text-amber-500'}
      >
        <Button variant="outline" title={invoice.isPaid ? 'Set as pending' : 'Set as paid'} onClick={async () => {
          updateInvoice(mutateInvoices, {fileHash: invoice.fileHash, isPaid: !invoice.isPaid});
        }}>
          {invoice.isPaid ? 'Paid' : 'Pending'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
