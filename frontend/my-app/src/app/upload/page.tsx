import {Card, CardHeader, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Upload} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";

export default function UploadPage() {
    return (
        <div className="container mx-auto p-4">
        <Card className="mb-8">
            <CardHeader>
            <h1 className="text-2xl font-bold">Upload Invoice</h1>
            </CardHeader>
            <CardContent>
            <div className="flex gap-4 mb-4">
                <Button className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Invoice
                </Button>
            </div>
            <form>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="invoiceNumber">Invoice Number</label>
                    <Input id="invoiceNumber" />
                </div>
                <div>
                    <label htmlFor="date">Date</label>
                    <Input id="date" type="date" />
                </div>
                <div>
                    <label htmlFor="supplierName">Supplier Name</label>
                    <Input id="supplierName" />
                </div>
                <div>
                    <label htmlFor="amount">Amount</label>
                    <Input id="amount" type="number" />
                </div>
                <div>
                    <label htmlFor="status">Status</label>
                    <Select id="status">
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    </Select>
                </div>
                </div>
                <div className="mt-4">
                <Button type="submit">Submit</Button>
                </div>
            </form>
            </CardContent>
        </Card>
        </div>
    )
}
