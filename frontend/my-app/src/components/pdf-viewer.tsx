"use client";

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
    <div className="relative h-full w-full bg-white p-4">
      <button className="absolute top-4 right-4" onClick={onClose}>
        <X className="w-6 h-6"/>
      </button>
      {!fileLink ? <p>Loading...</p> :
        <iframe src={fileLink}
                className="w-full h-96 border"/>}
    </div>
  );
}
