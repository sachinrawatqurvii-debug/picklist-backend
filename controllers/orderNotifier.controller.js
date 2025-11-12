import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import axios from "axios";

const EMAIL_ADDRESS = "sachinrawatqurvii@gmail.com";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// PCS rating function
const calculateRating = (expected, actual) => {
    if (actual >= expected) return "✅ Excellent";
    const percent = (actual / expected) * 100;
    if (percent >= 80) return "👍 Good";
    if (percent >= 50) return "⚠️ Average";
    return "❌ Poor";
};

const getUser = async (id) => {
    try {
        const response = await axios.get("https://fastapi.qurvii.com/getUsers")
        const data = await response?.data?.data;
        const user_name = data?.find((u) => u.id === id)?.user_name || "unknown";
        console.log(user_name?.split(" / ")[0])
        return user_name?.split(" / ")[0];

    } catch (error) {
        throw new Error(error)
    }
}


// Enhanced table rendering with better styling
const renderTable = (records = [], headers = [], expectedQtyMap = {}) => {
    if (!records?.length) return `<p style="color:#999; font-style:italic; padding:10px;">No records available.</p>`;

    return `
    <div style="overflow-x:auto; margin:10px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:12px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <thead>
                <tr style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff;">
                    ${headers.map(h => `<th style="border:1px solid #ddd; padding:8px 6px; text-align:left; font-weight:600;">${h}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${records.map((r, index) => `
                    <tr style="${index % 2 === 0 ? 'background:#f8f9fa;' : 'background:#fff;'}">
                        <td style="border:1px solid #e0e0e0; padding:6px; color:#2c3e50; font-weight:500;">${r.style_number || "-"}</td>
                        <td style="border:1px solid #e0e0e0; padding:6px;">${r.fromSize || r.size || "-"}</td>
                        <td style="border:1px solid #e0e0e0; padding:6px;">${r.toSize || "-"}</td>
                        <td style="border:1px solid #e0e0e0; padding:6px;">${r.rackSpace || "-"}</td>
                        <td style="border:1px solid #e0e0e0; padding:6px;">
                            <span style="padding:2px 6px; border-radius:3px; font-size:11px; background:${r.status === 'completed' ? '#d4edda' :
            r.status === 'pending' ? '#fff3cd' :
                r.status === 'in-progress' ? '#cce7ff' : '#f8d7da'
        }; color:${r.status === 'completed' ? '#155724' :
            r.status === 'pending' ? '#856404' :
                r.status === 'in-progress' ? '#004085' : '#721c24'
        };">${r.status || "-"}</span>
                        </td>
                        <td style="border:1px solid #e0e0e0; padding:6px; text-align:center; font-weight:600;">${r.availableStock ?? "-"}</td>
                        <td style="border:1px solid #e0e0e0; padding:6px; text-align:center;">${expectedQtyMap[r.style_number] ? calculateRating(expectedQtyMap[r.style_number], r.availableStock) : "-"}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    </div>`;
};

// Generate PDF for alteration records
const generateAlterationPDF = async (upRecords = [], downRecords = [], expectedQtyMap = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fillColor('#2c3e50')
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('Alteration Records Report', 50, 50);

            doc.fillColor('#666')
                .fontSize(10)
                .text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);

            let yPosition = 120;

            // Alteration UP Section
            if (upRecords.length > 0) {
                doc.fillColor('#3498db')
                    .fontSize(14)
                    .font('Helvetica-Bold')
                    .text('Alteration UP Size Records', 50, yPosition);

                yPosition += 30;

                // Table headers for UP records
                const upHeaders = ['Style No', 'From Size', 'To Size', 'Rack Space', 'Status', 'Available Stock', 'Rating'];
                drawTableHeader(doc, upHeaders, yPosition);
                yPosition += 25;

                // Table rows for UP records
                upRecords.forEach((record, index) => {
                    if (yPosition > 700) {
                        doc.addPage();
                        yPosition = 50;
                    }

                    drawTableRow(doc, [
                        record.style_number || '-',
                        record.fromSize || '-',
                        record.toSize || '-',
                        record.rackSpace || '-',
                        record.status || '-',
                        record.availableStock?.toString() || '-',
                        expectedQtyMap[record.style_number] ?
                            calculateRating(expectedQtyMap[record.style_number], record.availableStock) : '-'
                    ], yPosition, index % 2 === 0);

                    yPosition += 20;
                });

                yPosition += 30;
            }

            // Alteration DOWN Section
            if (downRecords.length > 0) {
                if (yPosition > 650) {
                    doc.addPage();
                    yPosition = 50;
                }

                doc.fillColor('#9b59b6')
                    .fontSize(14)
                    .font('Helvetica-Bold')
                    .text('Alteration DOWN Size Records', 50, yPosition);

                yPosition += 30;

                // Table headers for DOWN records
                const downHeaders = ['Style No', 'From Size', 'To Size', 'Rack Space', 'Status', 'Available Stock', 'Rating'];
                drawTableHeader(doc, downHeaders, yPosition);
                yPosition += 25;

                // Table rows for DOWN records
                downRecords.forEach((record, index) => {
                    if (yPosition > 700) {
                        doc.addPage();
                        yPosition = 50;
                    }

                    drawTableRow(doc, [
                        record.style_number || '-',
                        record.fromSize || '-',
                        record.toSize || '-',
                        record.rackSpace || '-',
                        record.status || '-',
                        record.availableStock?.toString() || '-',
                        expectedQtyMap[record.style_number] ?
                            calculateRating(expectedQtyMap[record.style_number], record.availableStock) : '-'
                    ], yPosition, index % 2 === 0);

                    yPosition += 20;
                });
            }

            // Footer
            doc.page.margins = { bottom: 50 };
            const bottom = doc.page.height - 50;

            doc.fillColor('#666')
                .fontSize(8)
                .text('Powered by Qurvii Logistics System', 50, bottom, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// Helper function to draw table header in PDF
const drawTableHeader = (doc, headers, yPosition) => {
    doc.fillColor('#ffffff')
        .rect(50, yPosition, 500, 20)
        .fill();

    let xPosition = 50;
    const columnWidths = [80, 60, 60, 80, 70, 80, 70];

    headers.forEach((header, index) => {
        doc.fillColor('#2c3e50')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(header, xPosition + 5, yPosition + 6, { width: columnWidths[index] - 10 });

        // Draw border
        doc.strokeColor('#cccccc')
            .lineWidth(0.5)
            .rect(xPosition, yPosition, columnWidths[index], 20)
            .stroke();

        xPosition += columnWidths[index];
    });
};

// Helper function to draw table row in PDF
const drawTableRow = (doc, rowData, yPosition, isEven) => {
    const backgroundColor = isEven ? '#f8f9fa' : '#ffffff';

    doc.fillColor(backgroundColor)
        .rect(50, yPosition, 500, 20)
        .fill();

    let xPosition = 50;
    const columnWidths = [80, 60, 60, 80, 70, 80, 70];

    rowData.forEach((cell, index) => {
        doc.fillColor('#333333')
            .fontSize(8)
            .font('Helvetica')
            .text(cell, xPosition + 5, yPosition + 6, {
                width: columnWidths[index] - 10,
                align: index === 5 ? 'center' : 'left'
            });

        // Draw border
        doc.strokeColor('#e0e0e0')
            .lineWidth(0.3)
            .rect(xPosition, yPosition, columnWidths[index], 20)
            .stroke();

        xPosition += columnWidths[index];
    });
};

const sendNotificationToEmail = async (req, res, next) => {
    const { status, expectedQtyMap } = req.body;

    if (!status || typeof status !== "object") {
        return next(new ApiError(400, "Invalid status payload"));
    }

    try {
         const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com", // Sendinblue SMTP host
            port: 587,                     // Recommended port
            secure: false,                 // TLS false for port 587
            auth: {
                user: "9b6dbb001@smtp-brevo.com", // Your Brevo SMTP login
                pass: process.env.SENDBLUE_PASSWORD   // Your Brevo SMTP password
            }
        });


        // Generate PDF for alteration records
        let pdfAttachment = null;
        try {
            const pdfBuffer = await generateAlterationPDF(
                status.aleration_For_Up_Size?.records || [],
                status.aleration_For_Down_Size?.records || [],
                expectedQtyMap
            );

            pdfAttachment = {
                filename: `alteration-records-${new Date().toISOString().split('T')[0]}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            };
        } catch (pdfError) {
            console.error("PDF generation error:", pdfError);
            // Continue without PDF attachment
        }

        // Enhanced HTML Email Body with modern styling
        const htmlBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Daily Inventory Report</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Poppins', Arial, sans-serif; margin:0; padding:0; background:#f5f7fa;">
            <div style="max-width: 900px; margin:20px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.08);">
                <!-- Header -->
                <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:25px 0; text-align:center;">
                    <h1 style="margin:0; font-size:28px; font-weight:600;">📦 Daily Orders Report</h1>
                    <p style="margin:5px 0 0; opacity:0.9; font-size:14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <!-- Main Content -->
                <div style="padding:30px;">
                    <!-- Summary Card -->
                    <div style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:white; padding:20px; border-radius:8px; margin-bottom:25px;">
                        <h3 style="margin:0 0 15px 0; font-size:18px;">📊 Quick Summary</h3>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
                         <div>
                                <div style="font-size:16px; opacity:0.9;">Channel : ${status?.channel || ""} </div>
                            </div>
                            <div>
                                <div style="font-size:16px; opacity:0.9;">Total Orders : ${status.totalOrders || 0} </div>
                            </div>
                            <div>
                                <div style="font-size:16px; opacity:0.9;">Actual Size Found : ${status.actualSizeFound?.Actual_Found_Qty || 0}</div>
                            </div>
                             <div>
                                <div style="font-size:16px; opacity:0.9;">Total Cutting : ${(status.totalOrders || 0) - (status.actualSizeFound?.Actual_Found_Qty || 0)}</div>
                            </div>
                            
                             <div>
                                <div style="font-size:16px; opacity:0.9;">Search By : ${await getUser(status.employee_id)} (employee id : ${status.employee_id})</div>
                            </div>
                             <div>
                                <div style="font-size:16px; opacity:0.9;"> Work Status : ${calculateRating(status.actualSizeFound?.Expected_To_Found_Actual_Size_Qty || 0, status.actualSizeFound?.Actual_Found_Qty || 0)} </div>
                            </div>
                        </div>
                    </div>

                    <!-- Actual Size Found Section -->
                    <div style="background:#fff; border:1px solid #e1e8ed; border-radius:8px; padding:20px; margin-bottom:25px;">
                        <h3 style="color:#2c3e50; margin:0 0 15px 0; font-size:16px; display:flex; align-items:center;">
                            <span style="background:#e74c3c; color:white; padding:4px 8px; border-radius:4px; margin-right:8px;">🎯</span>
                            Actual Size Found Analysis
                        </h3>
                        
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:20px;">
                            <div style="text-align:center; padding:15px; background:#f8f9fa; border-radius:6px;">
                                <div style="font-size:12px; color:#666;">Expected Qty</div>
                                <div style="font-size:18px; font-weight:600; color:#2c3e50;">${status.actualSizeFound?.Expected_To_Found_Actual_Size_Qty || 0}</div>
                            </div>
                            <div style="text-align:center; padding:15px; background:#f8f9fa; border-radius:6px;">
                                <div style="font-size:12px; color:#666;">Actual Found</div>
                                <div style="font-size:18px; font-weight:600; color:#27ae60;">${status.actualSizeFound?.Actual_Found_Qty || 0}</div>
                            </div>
                            <div style="text-align:center; padding:15px; background:#f8f9fa; border-radius:6px;">
                                <div style="font-size:12px; color:#666;">Gone Alteration</div>
                                <div style="font-size:18px; font-weight:600; color:#e67e22;">${status.actualSizeFound?.Expected_For_Found_Exact_Size_But_Gone_Alteration_Qty || 0}</div>
                            </div>
                            <div style="text-align:center; padding:15px; background:#f8f9fa; border-radius:6px;">
                                <div style="font-size:12px; color:#666;">Gone Cutting</div>
                                <div style="font-size:18px; font-weight:600; color:#c0392b;">${status.actualSizeFound?.Expected_For_Found_But_Gone_Cutting_Qty || 0}</div>
                            </div>
                        </div>

                        ${status.actualSizeFound?.Expected_For_Found_Exact_Size_But_Gone_Alteration_Record?.length ? `
                        <div style="margin-top:20px;">
                            <h4 style="color:#e67e22; margin:0 0 10px 0; font-size:14px;">🔹 Found but Gone Alteration Records</h4>
                            ${renderTable(status.actualSizeFound.Expected_For_Found_Exact_Size_But_Gone_Alteration_Record, [
            "Style No", "Size", "To Size", "Rack Space", "Status", "Available Stock", "Rating"
        ], expectedQtyMap)}
                        </div>
                        ` : ''}

                        ${status.actualSizeFound?.Expected_For_Found_But_Gone_Cutting_Qty_Record?.length ? `
                        <div style="margin-top:20px;">
                            <h4 style="color:#c0392b; margin:0 0 10px 0; font-size:14px;">🔹 Found but Gone Cutting Records</h4>
                            ${renderTable(status.actualSizeFound.Expected_For_Found_But_Gone_Cutting_Qty_Record, [
            "Style No", "Size", "To Size", "Rack Space", "Status", "Available Stock", "Rating"
        ], expectedQtyMap)}
                        </div>
                        ` : ''}
                    </div>

                    <!-- Cutting Section -->
                    ${status.cutting ? `
                    <div style="background:#fff; border:1px solid #e1e8ed; border-radius:8px; padding:20px; margin-bottom:25px;">
                        <h3 style="color:#27ae60; margin:0 0 15px 0; font-size:16px; display:flex; align-items:center;">
                            <span style="background:#27ae60; color:white; padding:4px 8px; border-radius:4px; margin-right:8px;">✂️</span>
                            Cutting Summary
                        </h3>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:15px; margin-bottom:15px;">
                            <div style="text-align:center; padding:12px; background:#f8f9fa; border-radius:6px;">
                                <div style="font-size:12px; color:#666;">Expected Cutting</div>
                                <div style="font-size:16px; font-weight:600; color:#27ae60;">${status.cutting.Expected_Cutting || 0}</div>
                            </div>
                            <div style="text-align:center; padding:12px; background:#f8f9fa; border-radius:6px;">
                                <div style="font-size:12px; color:#666;">Actual Records</div>
                                <div style="font-size:16px; font-weight:600; color:#27ae60;">${status.cutting.Actual_Cutting?.length || 0}</div>
                            </div>
                        </div>
                        ${renderTable(status.cutting.Actual_Cutting, [
            "Style No", "Size", "To Size", "Rack Space", "Status", "Available Stock", "Rating"
        ], expectedQtyMap)}
                    </div>
                    ` : ''}

                    <!-- Alteration Sections -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:25px;">
                        <!-- UP Size -->
                        <div style="background:#fff; border:1px solid #e1e8ed; border-radius:8px; padding:20px;">
                            <h3 style="color:#3498db; margin:0 0 15px 0; font-size:16px; display:flex; align-items:center;">
                                <span style="background:#3498db; color:white; padding:4px 8px; border-radius:4px; margin-right:8px;">📏</span>
                                Alteration UP Size
                            </h3>
                            <div style="text-align:center; padding:15px; background:#ebf5fb; border-radius:6px; margin-bottom:15px;">
                                <div style="font-size:14px; color:#3498db;">Quantity</div>
                                <div style="font-size:24px; font-weight:700; color:#2980b9;">${status.aleration_For_Up_Size?.Qty || 0}</div>
                            </div>
                            ${renderTable(status.aleration_For_Up_Size?.records, [
            "Style No", "From Size", "To Size", "Rack Space", "Status", "Available Stock", "Rating"
        ], expectedQtyMap)}
                        </div>

                        <!-- DOWN Size -->
                        <div style="background:#fff; border:1px solid #e1e8ed; border-radius:8px; padding:20px;">
                            <h3 style="color:#9b59b6; margin:0 0 15px 0; font-size:16px; display:flex; align-items:center;">
                                <span style="background:#9b59b6; color:white; padding:4px 8px; border-radius:4px; margin-right:8px;">📐</span>
                                Alteration DOWN Size
                            </h3>
                            <div style="text-align:center; padding:15px; background:#f4ecf7; border-radius:6px; margin-bottom:15px;">
                                <div style="font-size:14px; color:#9b59b6;">Quantity</div>
                                <div style="font-size:24px; font-weight:700; color:#8e44ad;">${status.aleration_For_Down_Size?.Qty || 0}</div>
                            </div>
                            ${renderTable(status.aleration_For_Down_Size?.records, [
            "Style No", "From Size", "To Size", "Rack Space", "Status", "Available Stock", "Rating"
        ], expectedQtyMap)}
                        </div>
                    </div>

                  

                    <!-- Footer -->
                    <div style="margin-top:30px; text-align:center; color:#7f8c8d; font-size:11px;">
                        <p>Generated  on ${new Date().toLocaleString()}</p>
                        <p>Powered by <strong>Qurvii Logistics System</strong> | Picklist Management Solution</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        // const recipients = [EMAIL_ADDRESS, "logistics@qurvii.com", "dev@qurvii.com"];
        // const recipients = [EMAIL_ADDRESS];
        const recipients = ["neelima@qurvii.com", "dev@qurvii.com", "logistics@qurvii.com", "anu@qurvii.com", "kajal@qurvii.com"];

        const mailOptions = {
            from: `Qurvii Logistics <${EMAIL_ADDRESS}>`,
            to: recipients.join(", "),
            subject: ` ${status?.channel} Daily Orders Report - ${new Date().toLocaleDateString()}`,
            html: htmlBody,
            attachments: pdfAttachment ? [pdfAttachment] : []
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Mail sent:", info.response);

        res.status(200).json(new ApiResponse(200, {
            info,
            pdfGenerated: !!pdfAttachment
        }, "Email sent successfully"));

    } catch (error) {
        console.error("Email error:", error);
        next(new ApiError(500, "Failed to send email"));
    }
};

// New endpoint to download alteration PDF
const downloadAlterationPDF = async (req, res, next) => {
    try {
        const { upRecords = [], downRecords = [], expectedQtyMap = {} } = req.body;

        const pdfBuffer = await generateAlterationPDF(upRecords, downRecords, expectedQtyMap);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="alteration-records-${new Date().toISOString().split('T')[0]}.pdf"`);

        res.send(pdfBuffer);
    } catch (error) {
        console.error("PDF download error:", error);
        next(new ApiError(500, "Failed to generate PDF"));
    }
};

const health = (req, res, next) => {
    res.status(200).json(new ApiResponse(200, {
        health: "OK",
        service: "Email Notification Service",
        timestamp: new Date().toISOString()
    }, "Service is healthy"));
};

export {
    sendNotificationToEmail,
    downloadAlterationPDF,
    health

};



