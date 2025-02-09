import {TableCell, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import Invoice from "@/app/models/invoice";
import {Checkbox} from "@/components/ui/checkbox";
import {useInvoices} from "@/hooks/use-invoices";
import {updateInvoice} from "@/lib/api";
import {CircleAlert} from "lucide-react";

export default function InvoiceRow({invoice, onView}: {
  invoice: Invoice,
  onView: () => void
}) {
  const {mutate} = useInvoices();

  return (
    <TableRow className={invoice.isReviewed ? '' : 'bg-zinc-200'}>
      <TableCell>
        <Checkbox checked={invoice.isReviewed} onCheckedChange={async () => {
          updateInvoice(mutate, invoice.fileHash, {isReviewed: !invoice.isReviewed});
        }}/>
      </TableCell>
      <TableCell>{invoice.id || <span className="text-zinc-600">unknown</span>}</TableCell>
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
          updateInvoice(mutate, invoice.fileHash, {isPaid: !invoice.isPaid});
        }}>
          {invoice.isPaid ? 'Paid' : 'Pending'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
