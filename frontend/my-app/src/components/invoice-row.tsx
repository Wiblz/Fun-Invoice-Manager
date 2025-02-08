import {TableCell, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import Invoice from "@/app/models/invoice";
import {setInvoiceReviewStatus} from "@/app/actions";
import {Checkbox} from "@/components/ui/checkbox";
import {useInvoices} from "@/hooks/use-invoices";
import {updateInvoice} from "@/lib/api";

export default function InvoiceRow({invoice, onView}: {
  invoice: Invoice,
  onView: () => void
}) {
  const { mutate } = useInvoices();

  return (
    <TableRow className={invoice.isReviewed ? '' : 'bg-zinc-200'}>
      <TableCell>
        <Checkbox checked={invoice.isReviewed} onCheckedChange={async () => {
          console.log('setting review status');
          await setInvoiceReviewStatus(invoice.fileHash, !invoice.isReviewed);
        }}/>
      </TableCell>
      <TableCell>{invoice.id || <span className="text-zinc-600">unknown</span>}</TableCell>
      <TableCell>{invoice.date}</TableCell>
      <TableCell>
        <a href="#" onClick={onView} className="text-blue-600 hover:underline">
          {invoice.originalFileName}
        </a>
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
