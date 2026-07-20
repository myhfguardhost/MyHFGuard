// src/lib/pdf.ts
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generate a PDF for a patient dashboard.
 * @param patient - Patient profile containing name and ID.
 * @param element - HTML element containing the charts to capture.
 */
export async function generatePatientPdf(
  patient: {
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    assigned_user_id?: string | null;
    patient_id: string;
  },
  element: HTMLElement
): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const combinedName = `${patient.first_name ?? ""} ${
      patient.last_name ?? ""
    }`.trim();

    const patientName =
      combinedName ||
      patient.full_name ||
      patient.assigned_user_id ||
      "Patient";

    const displayId =
      patient.assigned_user_id ||
      patient.patient_id;

    pdf.setFontSize(14);
    pdf.text(`Patient: ${patientName}`, 40, 40);
    pdf.text(`ID: ${displayId}`, 40, 60);

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 80;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    const availablePageHeight = pageHeight - 100;

    if (imgHeight <= availablePageHeight) {
      pdf.addImage(
        imgData,
        "PNG",
        40,
        80,
        imgWidth,
        imgHeight
      );
    } else {
      let remainingHeight = imgHeight;
      let position = 80;

      pdf.addImage(
        imgData,
        "PNG",
        40,
        position,
        imgWidth,
        imgHeight
      );

      remainingHeight -= availablePageHeight;

      while (remainingHeight > 0) {
        pdf.addPage();

        position = 40 - (imgHeight - remainingHeight);

        pdf.addImage(
          imgData,
          "PNG",
          40,
          position,
          imgWidth,
          imgHeight
        );

        remainingHeight -= pageHeight - 80;
      }
    }

    pdf.save(`Patient_${patient.patient_id}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
}