import {Card, CardContent, CardHeader} from "@/components/ui/card";
import UploadForm from "@/components/upload-form";

export default function UploadPage() {
  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <h1 className="text-2xl font-bold">Upload Invoice</h1>
        </CardHeader>
        <CardContent>
            <UploadForm />
        </CardContent>
      </Card>
    </div>
  )
}
