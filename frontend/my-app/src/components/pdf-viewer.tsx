"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PdfViewer({
  fileName,
  onClose,
}: {
  fileName: string;
  onClose: () => void;
}) {
  const [fileLink, setFileLink] = useState<string | null>(null);

  useEffect(() => {
    if (!fileName) {
      return;
    }

    async function fetchFileLink() {
      const response = await fetch(
        `http://localhost:8080/api/v1/invoice/${fileName}/file`,
      );
      const fileLink = await response.json();
      setFileLink(fileLink);
    }

    fetchFileLink();
  }, [fileName]);

  return (
    <Card>
      <CardTitle className="flex justify-end pt-2 pr-2">
        <Button variant="ghost" onClick={onClose}>
          <X className="w-6 h-6 text-neutral-500" />
        </Button>
      </CardTitle>
      <CardContent className="">
        <div className="h-full w-full bg-white p-4">
          {!fileLink ? (
            <p>Loading...</p>
          ) : (
            <iframe src={fileLink} className="w-full h-96 border" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
