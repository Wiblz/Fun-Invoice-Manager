import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Upload} from 'lucide-react'
import Link from "next/link";

interface Invoice {
  fileHash: string;
  originalFileName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: string;
  isPaid: boolean;
  isViewed: boolean;
}

export default async function InvoiceManager() {
  const response = await fetch('http://localhost:8080/api/v1/invoices');
  const invoices: Invoice[] = await response.json();

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <h1 className="text-2xl font-bold">Invoice Manager</h1>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Link href="/upload">
              <Button className="flex items-center gap-2">
                <Upload className="w-4 h-4"/>
                Upload Invoice
              </Button>
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.fileHash}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.invoiceDate}</TableCell>
                  <TableCell>{invoice.originalFileName}</TableCell>
                  <TableCell>{invoice.invoiceAmount}</TableCell>
                  <TableCell
                    className={invoice.isPaid ? 'text-green-700' : 'text-amber-500'}
                  >{invoice.isPaid ? 'Paid' : 'Pending'}</TableCell>
                  <TableCell>
                    <Button>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
