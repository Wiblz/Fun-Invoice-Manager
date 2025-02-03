import {TableCell, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import Invoice from "@/app/models/invoice";

export default function InvoiceRow({invoice, onView}: {
  invoice: Invoice,
  onView: () => void
}) {
  return (
    <TableRow>
      <TableCell>{invoice.id || <span className="text-zinc-600">unknown</span>}</TableCell>
      <TableCell>{invoice.date}</TableCell>
      <TableCell>{invoice.originalFileName}</TableCell>
      <TableCell>{invoice.amount}</TableCell>
      <TableCell
        className={invoice.isPaid ? 'text-green-700' : 'text-amber-500'}
      >{invoice.isPaid ? 'Paid' : 'Pending'}</TableCell>
      <TableCell>
        <Button onClick={onView}>View</Button>
      </TableCell>
    </TableRow>
  );
}
