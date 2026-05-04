import { Request, Response } from "express";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

export const extractOCR = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    let extractedText = "";
    let structuredData: any = null;

    // 📄 PDF Processing
    if (fileExtension === ".pdf" || mimeType === "application/pdf") {
      const result = await extractPDF(file.path);
      extractedText = result.text;
      structuredData = result.structured;
    }
    // 🖼️ Image Processing (JPEG, PNG, JPG, WEBP, BMP, GIF)
    else if (
      mimeType.startsWith("image/") ||
      ["jpg", "jpeg", "png", "webp", "bmp", "gif"].includes(fileExtension)
    ) {
      const result = await extractImageText(file.path);
      extractedText = result.text;
      structuredData = result.structured;
    }
    // 📊 Excel Processing (XLS, XLSX, CSV)
    else if (
      ["xls", "xlsx", "csv"].includes(fileExtension.replace(".", "")) ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel")
    ) {
      const result = await extractExcelData(file.path);
      extractedText = result.text;
      structuredData = result.data;
    }
    // ❌ Unsupported file type
    else {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type: ${fileExtension}. Supported types: PDF, Images (JPEG, PNG, WEBP, BMP, GIF), Excel (XLS, XLSX, CSV)`,
      });
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(file.path);
    } catch (cleanupError) {
      console.warn("Failed to cleanup file:", cleanupError);
    }

    return res.status(200).json({
      success: true,
      message: "Extraction completed successfully",
      data: {
        fileName: file.originalname,
        fileType: getFileCategory(fileExtension),
        text: extractedText,
        structuredData: structuredData,
        wordCount: extractedText.split(/\s+/).filter(Boolean).length,
        charCount: extractedText.length,
      },
    });
  } catch (error) {
    console.error("OCR Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to extract content from file",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Extract text from PDF files
 */
async function extractPDF(filePath: string): Promise<{
  text: string;
  structured: any;
}> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const text = data.text.trim();

    // Try to extract structured data from PDF text
    const structured = parseTextStructure(text);

    return {
      text,
      structured: {
        pages: data.numpages,
        info: {
          title: data.info?.Title || null,
          author: data.info?.Author || null,
          subject: data.info?.Subject || null,
          keywords: data.info?.Keywords || null,
          creationDate: data.info?.CreationDate || null,
        },
        extractedData: structured,
      },
    };
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract text from images using Tesseract OCR
 */
async function extractImageText(
  filePath: string,
): Promise<{ text: string; structured: any }> {
  try {
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(filePath, "eng", {
      logger: (m) => {
        if (process.env.NODE_ENV === "development") {
          console.log("OCR Progress:", m);
        }
      },
    });

    const cleanText = text.trim();
    const structured = parseTextStructure(cleanText);

    return {
      text: cleanText,
      structured: {
        confidence: Math.round(confidence * 100) / 100,
        extractedData: structured,
      },
    };
  } catch (error) {
    console.error("Image OCR Error:", error);
    throw new Error("Failed to extract text from image");
  }
}

/**
 * Extract data from Excel files
 */
async function extractExcelData(filePath: string): Promise<{
  text: string;
  data: any;
}> {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheets: Record<string, any> = {};
    const allText: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      }) as any[][];

      const headers = jsonData[0] || [];
      const rows = jsonData.slice(1).filter((row) =>
        row.some((cell) => cell !== ""),
      );

      // Convert to objects if headers exist
      const objects = rows.map((row) => {
        const obj: Record<string, any> = {};
        headers.forEach((header, index) => {
          obj[String(header) || `Column_${index + 1}`] = row[index] ?? "";
        });
        return obj;
      });

      sheets[sheetName] = {
        headers: headers.filter(Boolean),
        rowCount: rows.length,
        data: objects,
      };

      // Build text representation
      allText.push(`Sheet: ${sheetName}`);
      allText.push(headers.join(" | "));
      rows.forEach((row) => {
        allText.push(row.join(" | "));
      });
    }

    return {
      text: allText.join("\n"),
      data: {
        sheetNames: workbook.SheetNames,
        totalSheets: workbook.SheetNames.length,
        sheets,
      },
    };
  } catch (error) {
    console.error("Excel Extraction Error:", error);
    throw new Error("Failed to extract data from Excel file");
  }
}

/**
 * Parse text structure to extract meaningful data patterns
 */
function parseTextStructure(text: string): any {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract email addresses
  const emails = text.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];

  // Extract phone numbers
  const phones = text.match(/\+?[\d\s()-]{10,}/g) || [];


  // Extract dates (multiple formats)
  const dates = text.match(
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g,
  ) || [];

  // Extract monetary values
  const amounts = text.match(/\$?[\d,]+\.?\d*/g) || [];

  // Extract potential headings (lines that look like titles)
  const headings = lines.filter(
    (line) => line.length < 100 && line === line.toUpperCase(),
  );


  return {
    lineCount: lines.length,
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
    dates: [...new Set(dates)],
    potentialAmounts: [...new Set(amounts)].slice(0, 20),
    headings: headings.slice(0, 10),
  };
}

/**
 * Get file category for response
 */
function getFileCategory(extension: string): string {
  const ext = extension.toLowerCase().replace(".", "");
  if (["pdf"].includes(ext)) return "PDF";
  if (["jpg", "jpeg", "png", "webp", "bmp", "gif"].includes(ext))
    return "IMAGE";
  if (["xls", "xlsx", "csv"].includes(ext)) return "EXCEL";
  return "UNKNOWN";
}
