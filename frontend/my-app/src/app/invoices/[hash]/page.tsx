import type Invoice from "@/app/models/invoice";
import EditForm from "@/components/editForm";

export async function generateStaticParams() {
  const invoices = await fetch("http://localhost:8080/api/v1/invoices").then(
    (res) => res.json(),
  );

  return invoices.map((invoice: Invoice) => ({ hash: invoice.fileHash }));
}

export default async function InvoiceDetailedView({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const hash = await params.then((p) => p.hash);

  return <EditForm hash={hash} />;
}
