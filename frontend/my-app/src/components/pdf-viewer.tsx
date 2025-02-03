"use client";

import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {useEffect, useState} from "react";
import {X} from "lucide-react";

export default function PdfViewer({fileName, onClose}: { fileName: string, onClose: () => void }) {
  const [fileLink, setFileLink] = useState<string | null>(null);

  useEffect(() => {
    if (!fileName) {
      return;
    }

    async function fetchFileLink() {
      const response = await fetch(`http://localhost:8080/api/v1/invoice/${fileName}/file`);
      const fileLink = await response.json();
      setFileLink(fileLink);
    }

    fetchFileLink();
  }, [fileName]);

  return (
    <Card className="relative">
      <button className="absolute top-4 right-4" onClick={onClose}>
        <X className="w-6 h-6"/>
      </button>
      <CardHeader>
        <h2 className="text-xl font-bold">Invoice Preview</h2>
      </CardHeader>
      <CardContent>
        {!fileLink ? <p>Loading...</p> :
          <iframe src={fileLink}
                  className="w-full h-96 border"/>}
      </CardContent>
    </Card>
  );
}
