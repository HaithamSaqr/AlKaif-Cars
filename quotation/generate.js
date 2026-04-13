const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, HeadingLevel, LevelFormat, TabStopType, TabStopPosition,
  ImageRun } = require('docx');
const fs = require('fs');
const path = require('path');

// =============================================
// CONSTANTS
// =============================================
const RED = "E31E24";
const BLACK = "0D0D0D";
const DARK = "1A1A1A";
const GRAY = "666666";
const LIGHT_GRAY = "F5F5F5";
const WHITE = "FFFFFF";
const BORDER_COLOR = "DDDDDD";

const fullWidth = 9360; // US Letter with 1" margins
const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };
const cellPad = { top: 100, bottom: 100, left: 140, right: 140 };

const today = new Date();
const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
const quoteNum = `FIT-Q-${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;

// =============================================
// HELPER FUNCTIONS
// =============================================
function heading(text, level = HeadingLevel.HEADING_1, align = AlignmentType.RIGHT) {
  return new Paragraph({
    heading: level,
    alignment: align,
    spacing: { before: 300, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Tahoma", size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22, color: BLACK })]
  });
}

function headingAr(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { before: 300, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Tahoma", size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22, color: RED })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.RIGHT,
    bidirectional: opts.rtl !== false,
    spacing: { before: opts.spaceBefore || 60, after: opts.spaceAfter || 60 },
    children: [new TextRun({ text, font: "Tahoma", size: opts.size || 22, color: opts.color || "333333", bold: opts.bold || false })]
  });
}

function spacer(height = 200) {
  return new Paragraph({ spacing: { before: height, after: 0 }, children: [] });
}

function redLine() {
  return new Paragraph({
    spacing: { before: 100, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RED, space: 1 } },
    children: []
  });
}

function twoColRow(label, value, isHeader = false, shade = false) {
  const bgFill = isHeader ? RED : shade ? "F9F9F9" : WHITE;
  const textColor = isHeader ? WHITE : "333333";
  const labelColor = isHeader ? WHITE : "555555";
  return new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 5460, type: WidthType.DXA },
        shading: { fill: bgFill, type: ShadingType.CLEAR },
        margins: cellPad,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: value, font: "Tahoma", size: 22, color: textColor, bold: isHeader })] })]
      }),
      new TableCell({
        borders, width: { size: 3900, type: WidthType.DXA },
        shading: { fill: bgFill, type: ShadingType.CLEAR },
        margins: cellPad,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: label, font: "Tahoma", size: 22, color: labelColor, bold: true })] })]
      }),
    ]
  });
}

function priceRow(item, price, isHeader = false, shade = false, bold = false) {
  const bgFill = isHeader ? RED : shade ? "F9F9F9" : WHITE;
  const textColor = isHeader ? WHITE : bold ? RED : "333333";
  return new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 3000, type: WidthType.DXA },
        shading: { fill: bgFill, type: ShadingType.CLEAR },
        margins: cellPad,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: price, font: "Tahoma", size: 22, color: textColor, bold: isHeader || bold })] })]
      }),
      new TableCell({
        borders, width: { size: 6360, type: WidthType.DXA },
        shading: { fill: bgFill, type: ShadingType.CLEAR },
        margins: cellPad,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: item, font: "Tahoma", size: 22, color: isHeader ? WHITE : "333333", bold: isHeader || bold })] })]
      }),
    ]
  });
}

function screenshotPlaceholder(title, description, imageName) {
  const imgPath = path.join(__dirname, 'screenshots', imageName);
  const hasImage = fs.existsSync(imgPath);

  const content = [
    new Paragraph({
      spacing: { before: 240, after: 80 },
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [new TextRun({ text: title, font: "Tahoma", size: 22, bold: true, color: RED })]
    }),
    new Paragraph({
      spacing: { before: 40, after: 120 },
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [new TextRun({ text: description, font: "Tahoma", size: 20, color: GRAY })]
    }),
  ];

  if (hasImage) {
    // Embed real screenshot - width 9360 DXA = 6.5 inches = 468pt, height proportional (1400x900 aspect = ~301pt)
    content.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 120 },
      children: [new ImageRun({
        type: "png",
        data: fs.readFileSync(imgPath),
        transformation: { width: 620, height: 398 },
        altText: { title: title, description: description, name: imageName }
      })]
    }));
  }

  content.push(spacer(80));
  return content;
}

// =============================================
// DOCUMENT
// =============================================
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Tahoma", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Tahoma" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Tahoma" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "deliverables", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "terms", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    // ========== PAGE 1: COVER ==========
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: "FALCON IT", font: "Tahoma", size: 18, bold: true, color: RED }),
              new TextRun({ text: "  |  falcon-it.sa", font: "Tahoma", size: 16, color: GRAY }),
            ]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR, space: 4 } },
            spacing: { before: 100 },
            children: [
              new TextRun({ text: "Falcon IT Solutions  |  falcon-it.sa  |  ", font: "Tahoma", size: 16, color: GRAY }),
              new TextRun({ text: "Page ", font: "Tahoma", size: 16, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Tahoma", size: 16, color: GRAY }),
            ]
          })]
        })
      },
      children: [
        spacer(600),

        // FALCON IT logo area
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "FALCON IT", font: "Tahoma", size: 56, bold: true, color: RED })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "S O L U T I O N S", font: "Tahoma", size: 22, color: GRAY, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "falcon-it.sa", font: "Tahoma", size: 20, color: GRAY })]
        }),

        redLine(),
        spacer(300),

        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "PROJECT QUOTATION", font: "Tahoma", size: 36, bold: true, color: BLACK })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          bidirectional: true,
          children: [new TextRun({ text: "عرض سعر مشروع", font: "Tahoma", size: 32, bold: true, color: RED })]
        }),

        spacer(300),

        // Quote info table
        new Table({
          width: { size: 6000, type: WidthType.DXA },
          columnWidths: [3000, 3000],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dateStr, font: "Tahoma", size: 22, color: "333333" })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: quoteNum, font: "Tahoma", size: 22, bold: true, color: RED })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Date / التاريخ", font: "Tahoma", size: 18, color: GRAY })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Quote # / رقم العرض", font: "Tahoma", size: 18, color: GRAY })] })] }),
            ]}),
          ]
        }),

        spacer(400),

        // Client & Project
        new Table({
          width: { size: fullWidth, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, children: [
                new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 60 }, children: [new TextRun({ text: "المشروع / Project", font: "Tahoma", size: 18, color: GRAY })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: "موقع معرض سيارات متكامل مع لوحة تحكم", font: "Tahoma", size: 22, bold: true, color: BLACK })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: "Full Car Dealership Website + Admin Panel", font: "Tahoma", size: 20, color: GRAY })] }),
              ]}),
              new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, children: [
                new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 60 }, children: [new TextRun({ text: "العميل / Client", font: "Tahoma", size: 18, color: GRAY })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: "الكيف للسيارات", font: "Tahoma", size: 24, bold: true, color: RED })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text: "El-Kaif Cars", font: "Tahoma", size: 20, color: GRAY })] }),
              ]}),
            ]}),
          ]
        }),

        spacer(300),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [
            new TextRun({ text: "Demo: ", font: "Tahoma", size: 20, color: GRAY }),
            new TextRun({ text: "cars.falcon-it.sa", font: "Tahoma", size: 22, bold: true, color: RED, underline: {} }),
          ]
        }),
      ]
    },

    // ========== PAGE 2+: PROJECT SCOPE ==========
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: "FALCON IT", font: "Tahoma", size: 18, bold: true, color: RED }),
              new TextRun({ text: `\t${quoteNum}`, font: "Tahoma", size: 16, color: GRAY }),
            ]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR, space: 4 } },
            spacing: { before: 100 },
            children: [
              new TextRun({ text: "Falcon IT  |  falcon-it.sa  |  Confidential  |  Page ", font: "Tahoma", size: 16, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Tahoma", size: 16, color: GRAY }),
            ]
          })]
        })
      },
      children: [
        // ===== SECTION 1: PROJECT OVERVIEW =====
        headingAr("1. نظرة عامة على المشروع"),
        heading("Project Overview", HeadingLevel.HEADING_2),
        para("تصميم وتطوير موقع إلكتروني متكامل لمعرض الكيف للسيارات يشمل واجهة مستخدم احترافية باللغة العربية مع نظام إدارة محتوى (لوحة تحكم) كامل يمكّن العميل من إدارة جميع محتويات الموقع بسهولة."),
        para("A complete car dealership website for El-Kaif Cars featuring a premium Arabic RTL user interface with a full content management system (Admin Panel) enabling the client to manage all website content independently.", { color: GRAY, size: 20 }),
        spacer(100),

        // Info table
        new Table({
          width: { size: fullWidth, type: WidthType.DXA },
          columnWidths: [5460, 3900],
          rows: [
            twoColRow("البيان / Field", "التفاصيل / Details", true),
            twoColRow("اسم المشروع", "موقع الكيف للسيارات الإلكتروني"),
            twoColRow("العميل", "الكيف للسيارات / El-Kaif Cars", false, true),
            twoColRow("رابط النسخة التجريبية", "cars.falcon-it.sa"),
            twoColRow("نوع المشروع", "موقع معرض سيارات + لوحة تحكم + استضافة", false, true),
            twoColRow("التقنيات المستخدمة", "Node.js, Express, SQLite, EJS, Bootstrap RTL"),
            twoColRow("الاستضافة", "Docker Container - سيرفر مخصص", false, true),
            twoColRow("اللغة", "عربي (RTL) مع دعم الإنجليزية"),
            twoColRow("مدة التنفيذ", "2-3 أسابيع من تاريخ الموافقة", false, true),
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== SECTION 2: DELIVERABLES =====
        headingAr("2. مخرجات المشروع"),
        heading("Deliverables", HeadingLevel.HEADING_2),

        // Public Website
        para("أ. الموقع العام (Public Website)", { bold: true, size: 24, color: BLACK }),
        redLine(),

        ...[
          "الصفحة الرئيسية - سلايدر بانر رئيسي متحرك + شريط بحث ذكي + سيارات مميزة + إحصائيات الشركة + علامات تجارية + طلب شراء",
          "صفحة السيارات - عرض جميع السيارات مع فلاتر متقدمة (السعر، العلامة التجارية، نوع السيارة، الحالة) مع التصفح بالصفحات",
          "صفحة تفاصيل السيارة - معرض صور + مواصفات كاملة + نموذج طلب شراء مباشر مع بيانات التمويل",
          "صفحة العلامات التجارية - عرض جميع الماركات مع عدد السيارات المتاحة لكل ماركة",
          "صفحة من نحن - معلومات الشركة + إحصائيات + قيم + آراء العملاء",
          "صفحة تواصل معنا - نموذج تواصل + بيانات الفروع + واتساب مباشر",
          "صفحة طلب شراء - نموذج شامل للأفراد والشركات مع خيارات التمويل",
        ].map(text => new Paragraph({
          numbering: { reference: "deliverables", level: 0 },
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text, font: "Tahoma", size: 20, color: "333333" })]
        })),

        spacer(200),

        // Admin Panel
        para("ب. لوحة التحكم (Admin Panel)", { bold: true, size: 24, color: BLACK }),
        redLine(),

        ...[
          "لوحة معلومات رئيسية - إحصائيات فورية (عدد السيارات، الطلبات الجديدة، الرسائل غير المقروءة)",
          "إدارة السيارات - إضافة / تعديل / حذف السيارات مع رفع صور متعددة وتحديد المواصفات والمميزات",
          "إدارة العلامات التجارية - إضافة / تعديل / حذف الماركات مع رفع الشعارات",
          "إدارة طلبات الشراء - عرض جميع الطلبات الواردة من العملاء مع تحديث حالة الطلب (جديد / قيد المعالجة / مكتمل / ملغي)",
          "إدارة رسائل التواصل - عرض رسائل العملاء مع إمكانية التصنيف (مقروءة / غير مقروءة)",
          "إدارة السلايدر - تحكم كامل بالبانرات الإعلانية في الصفحة الرئيسية",
          "إدارة آراء العملاء - إضافة وتعديل تقييمات وشهادات العملاء",
          "إدارة الفروع - إضافة بيانات الفروع (العنوان، الهاتف، أوقات العمل)",
          "إعدادات الموقع - تعديل بيانات الشركة وروابط التواصل الاجتماعي والإحصائيات",
          "إدارة المستخدمين - إنشاء حسابات للمشرفين والمحررين مع صلاحيات مختلفة (مدير / محرر)",
        ].map(text => new Paragraph({
          numbering: { reference: "deliverables", level: 0 },
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text, font: "Tahoma", size: 20, color: "333333" })]
        })),

        spacer(200),

        // Technical
        para("ج. البنية التقنية (Technical Infrastructure)", { bold: true, size: 24, color: BLACK }),
        redLine(),

        ...[
          "خادم Node.js + Express مع قاعدة بيانات SQLite",
          "نظام مصادقة آمن مع تشفير كلمات المرور (bcrypt)",
          "نظام رفع وإدارة الصور (صور السيارات، شعارات الماركات، صور السلايدر)",
          "تصميم متجاوب يعمل على جميع الأجهزة (كمبيوتر، تابلت، موبايل)",
          "حاوية Docker واحدة للنشر السهل والمحمول",
          "نسخ احتياطي تلقائي لقاعدة البيانات",
        ].map(text => new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text, font: "Tahoma", size: 20, color: "333333" })]
        })),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== SECTION 3: SCREENSHOTS =====
        headingAr("3. معاينة المشروع"),
        heading("Project Preview", HeadingLevel.HEADING_2),
        para("يمكنكم معاينة النسخة التجريبية الكاملة عبر الرابط التالي:", { size: 22 }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "cars.falcon-it.sa", font: "Tahoma", size: 28, bold: true, color: RED, underline: {} })]
        }),

        ...screenshotPlaceholder("الصفحة الرئيسية / Homepage", "سلايدر متحرك + بحث ذكي + سيارات مميزة + علامات تجارية", "01-homepage.png"),
        ...screenshotPlaceholder("صفحة السيارات / Cars Listing", "فلاتر متقدمة + بطاقات سيارات + تصفح بالصفحات", "02-cars.png"),

        new Paragraph({ children: [new PageBreak()] }),

        ...screenshotPlaceholder("صفحة العلامات التجارية / Brands", "شبكة ماركات مع عدد السيارات لكل ماركة", "03-brands.png"),
        ...screenshotPlaceholder("لوحة التحكم / Admin Dashboard", "إحصائيات فورية + آخر الطلبات + آخر الرسائل", "05-admin-dashboard.png"),

        new Paragraph({ children: [new PageBreak()] }),

        ...screenshotPlaceholder("إدارة السيارات / Cars Management", "جدول السيارات مع إمكانية الإضافة والتعديل والحذف", "06-admin-cars.png"),
        ...screenshotPlaceholder("طلبات الشراء / Purchase Requests", "عرض وإدارة طلبات العملاء مع تصفية حسب الحالة", "07-admin-requests.png"),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== SECTION 4: PRICING =====
        headingAr("4. التسعير"),
        heading("Pricing", HeadingLevel.HEADING_2),

        new Table({
          width: { size: fullWidth, type: WidthType.DXA },
          columnWidths: [6360, 3000],
          rows: [
            priceRow("البند / Item", "المبلغ / Amount", true),
            priceRow("تصميم وتطوير الموقع العام (7 صفحات)", ""),
            priceRow("Design & Development of Public Website", "", false, true),
            priceRow("تطوير لوحة التحكم الكاملة (10+ أقسام)", ""),
            priceRow("Full Admin Panel Development", "", false, true),
            priceRow("قاعدة البيانات والبنية التقنية", ""),
            priceRow("Database & Technical Infrastructure", "", false, true),
            priceRow("إعداد Docker والنشر الأولي", ""),
            priceRow("Docker Setup & Initial Deployment", "", false, true),
            priceRow("", ""),
            priceRow("إجمالي المشروع / Total Project Cost", "40,000 EGP", false, false, true),
          ]
        }),

        spacer(300),

        // Hosting
        headingAr("5. الاستضافة السنوية"),
        heading("Annual Hosting", HeadingLevel.HEADING_2),

        new Table({
          width: { size: fullWidth, type: WidthType.DXA },
          columnWidths: [6360, 3000],
          rows: [
            priceRow("البند / Item", "المبلغ / Amount", true),
            priceRow("استضافة سنوية تشمل:", ""),
            priceRow("    - سيرفر مخصص (Docker Container)", "", false, true),
            priceRow("    - شهادة SSL مجانية", ""),
            priceRow("    - نسخ احتياطي يومي", "", false, true),
            priceRow("    - مراقبة وضمان عمل الموقع 99.9%", ""),
            priceRow("    - دعم فني أساسي", "", false, true),
            priceRow("", ""),
            priceRow("الاستضافة السنوية / Annual Hosting", "15,000 EGP/year", false, false, true),
          ]
        }),

        para("* تبدأ رسوم الاستضافة من العام التالي لتاريخ إطلاق الموقع. العام الأول مشمول في قيمة المشروع.", { color: RED, size: 20, italics: true }),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== SECTION 6: PAYMENT TERMS =====
        headingAr("6. شروط الدفع"),
        heading("Payment Terms", HeadingLevel.HEADING_2),

        new Table({
          width: { size: fullWidth, type: WidthType.DXA },
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: RED, type: ShadingType.CLEAR }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "المبلغ", font: "Tahoma", size: 22, bold: true, color: WHITE })] })] }),
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: RED, type: ShadingType.CLEAR }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "الموعد", font: "Tahoma", size: 22, bold: true, color: WHITE })] })] }),
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: RED, type: ShadingType.CLEAR }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "الدفعة", font: "Tahoma", size: 22, bold: true, color: WHITE })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "20,000 EGP", font: "Tahoma", size: 22, bold: true, color: RED })] })] }),
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: "عند الموافقة على العرض", font: "Tahoma", size: 20 })] })] }),
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: "الدفعة الأولى (50%)", font: "Tahoma", size: 20, bold: true })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "F9F9F9", type: ShadingType.CLEAR }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "20,000 EGP", font: "Tahoma", size: 22, bold: true, color: RED })] })] }),
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "F9F9F9", type: ShadingType.CLEAR }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: "عند التسليم والإطلاق", font: "Tahoma", size: 20 })] })] }),
              new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "F9F9F9", type: ShadingType.CLEAR }, margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, children: [new TextRun({ text: "الدفعة الثانية (50%)", font: "Tahoma", size: 20, bold: true })] })] }),
            ]}),
          ]
        }),

        spacer(300),

        // ===== SECTION 7: IMPORTANT NOTES =====
        headingAr("7. ملاحظات هامة"),
        heading("Important Notes", HeadingLevel.HEADING_2),

        ...[
          "هذا العرض ساري لمدة 30 يوم من تاريخ الإصدار.",
          "أي تعديلات أو إضافات أو دعم فني بعد إطلاق الموقع يتم بعرض سعر منفصل.",
          "يشمل المشروع جولة تدريبية كاملة على لوحة التحكم عند التسليم.",
          "العميل مسؤول عن توفير المحتوى النهائي (صور السيارات، النصوص، الشعارات).",
          "يتم تسليم الموقع على النطاق الفرعي cars.falcon-it.sa وبعد الموافقة النهائية يتم النقل للنطاق الخاص بالعميل.",
          "أي طلبات خارج نطاق هذا العرض تُسعّر بشكل منفصل ولا تُنفّذ إلا بموافقة كتابية من الطرفين.",
          "الاستضافة السنوية (15,000 ج.م) تبدأ من العام الثاني بعد الإطلاق.",
        ].map((text, i) => new Paragraph({
          numbering: { reference: "terms", level: 0 },
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 80, after: 80 },
          children: [new TextRun({ text, font: "Tahoma", size: 20, color: "333333" })]
        })),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== SECTION 8: SIGNATURES =====
        headingAr("8. التوقيعات"),
        heading("Signatures", HeadingLevel.HEADING_2),

        para("بالتوقيع أدناه، يوافق الطرفان على جميع الشروط والأحكام المذكورة في هذا العرض.", { size: 20 }),
        spacer(400),

        new Table({
          width: { size: fullWidth, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 200, right: 200 }, children: [
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "العميل / Client", font: "Tahoma", size: 20, bold: true, color: GRAY })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, bidirectional: true, children: [new TextRun({ text: "الكيف للسيارات", font: "Tahoma", size: 22, bold: true, color: BLACK })] }),
                spacer(300),
                new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY, space: 1 } }, alignment: AlignmentType.CENTER, children: [] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: "الاسم والتوقيع / Name & Signature", font: "Tahoma", size: 16, color: GRAY })] }),
                spacer(200),
                new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY, space: 1 } }, alignment: AlignmentType.CENTER, children: [] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: "التاريخ / Date", font: "Tahoma", size: 16, color: GRAY })] }),
              ]}),
              new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 200, right: 200 }, children: [
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "مقدم الخدمة / Provider", font: "Tahoma", size: 20, bold: true, color: GRAY })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Falcon IT Solutions", font: "Tahoma", size: 22, bold: true, color: RED })] }),
                spacer(300),
                new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY, space: 1 } }, alignment: AlignmentType.CENTER, children: [] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: "الاسم والتوقيع / Name & Signature", font: "Tahoma", size: 16, color: GRAY })] }),
                spacer(200),
                new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY, space: 1 } }, alignment: AlignmentType.CENTER, children: [] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: "التاريخ / Date", font: "Tahoma", size: 16, color: GRAY })] }),
              ]}),
            ]}),
          ]
        }),

        spacer(400),

        // Contact footer
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: RED, space: 8 } },
          spacing: { before: 200, after: 60 },
          children: [new TextRun({ text: "FALCON IT SOLUTIONS", font: "Tahoma", size: 20, bold: true, color: RED })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "falcon-it.sa  |  info@falcon-it.sa", font: "Tahoma", size: 18, color: GRAY })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          bidirectional: true,
          children: [new TextRun({ text: "شكراً لثقتكم", font: "Tahoma", size: 22, bold: true, color: RED })]
        }),
      ]
    }
  ]
});

// =============================================
// GENERATE
// =============================================
Packer.toBuffer(doc).then(buffer => {
  const outputPath = `${__dirname}/Falcon-IT_Quotation_ElKaif-Cars_${quoteNum}_final.docx`;
  fs.writeFileSync(outputPath, buffer);
  console.log(`Quotation generated: ${outputPath}`);
});
