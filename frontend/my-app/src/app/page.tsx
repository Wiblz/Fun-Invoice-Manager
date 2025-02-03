import Invoice from "@/app/models/invoice";
import InvoiceList from "@/components/invoice-list";

export default async function InvoiceManager() {
  const response = await fetch('http://localhost:8080/api/v1/invoices');
  const invoices: Invoice[] = await response.json();

  return (
    <InvoiceList invoices={invoices}/>
  );
}
