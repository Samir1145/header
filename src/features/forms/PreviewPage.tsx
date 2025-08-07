import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import Button from '@/components/ui/Button'
// Import your preview components
import FormAPreview from './schemas/FastTrackClaims/ciftp_form_aHTMLpreview';
// import OtherFormPreview from './previews/OtherFormPreview';

interface FormData {
  [key: string]: any;
}

interface PreviewPageProps {
  formId: string;
  formData?: FormData;
}

const previewComponents: Record<string, React.FC<{ formData: FormData }>> = {
  ciftp_form_a: FormAPreview,
  // otherForm: OtherFormPreview,
};

export default function PreviewPage({ formId, formData = {} }: PreviewPageProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const element = previewRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save(`${formId || 'form'}-preview.pdf`);
  };
console.log('previewComponents',previewComponents)
console.log('formId',formId)
  const PreviewComponent = previewComponents[formId] || (() => <div>No preview available</div>);

  return (
    <div>
      <div
        ref={previewRef}
        style={{
          // background: '#fff',
          padding: 24,
          borderRadius: 6,
          boxShadow: '0 2px 8px #eee',
        }}
      >
        <PreviewComponent formData={formData} />
      </div>

      <Button
        type="button"
        onClick={handleDownloadPDF}
       style={{marginTop:10}}
        variant="default"
      >
        Download PDF
      </Button>
    </div>
  );
}
