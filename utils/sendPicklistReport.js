// utils/emailService.js
import nodemailer from "nodemailer";
import sendinblueTransport from "nodemailer-sendinblue-transport";

const EMAIL_ADDRESS = "sachinrawatqurvii@gmail.com";

// Helper functions for email template
function getEfficiencyClass(efficiency) {
    if (efficiency >= 80) return 'efficiency-high';
    if (efficiency >= 60) return 'efficiency-medium';
    return 'efficiency-low';
}

function calculateAverageEfficiency(employees) {
    if (!employees.length) return 0;
    const validEfficiencies = employees.filter(emp => emp.efficiency > 0).map(emp => emp.efficiency);
    if (!validEfficiencies.length) return 0;
    const total = validEfficiencies.reduce((sum, eff) => sum + eff, 0);
    return (total / validEfficiencies.length).toFixed(2);
}

function getTopPerformer(employees) {
    if (!employees.length) return 'N/A';
    const validEmployees = employees.filter(emp => emp.efficiency > 0);
    if (!validEmployees.length) return 'N/A';
    const top = validEmployees.reduce((best, current) =>
        (current.efficiency || 0) > (best.efficiency || 0) ? current : best
    );
    return `Emp ${top.employee_id} (${top.efficiency}%)`;
}

function getMostActiveChannel(picklists) {
    if (!picklists.length) return 'N/A';
    const channelCount = {};
    picklists.forEach(item => {
        if (item.channel) {
            channelCount[item.channel] = (channelCount[item.channel] || 0) + 1;
        }
    });
    if (Object.keys(channelCount).length === 0) return 'N/A';
    const mostActive = Object.entries(channelCount).reduce((a, b) => a[1] > b[1] ? a : b);
    return mostActive[0];
}

// Email sending function
export const sendPicklistReportEmail = async (reportData) => {
    const { picklistReport, firstAttemptEmployeeSummary, secondAttemptEmployeeSummary } = reportData;

    try {
        const transporter = nodemailer.createTransport(
            new sendinblueTransport({
                apiKey: process.env.SENDBLUE_PASSWORD_API_KEY
            })
        );

        // Enhanced HTML Email Body for Picklist Report
        const htmlBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Daily Picklist Performance Report</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px; }
                .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
                .summary-value { font-size: 24px; font-weight: 700; color: #2c3e50; margin: 5px 0; }
                .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
                .table-container { overflow-x: auto; margin: 20px 0; }
                .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .data-table th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; }
                .data-table td { padding: 10px 8px; border-bottom: 1px solid #e1e8ed; font-size: 11px; }
                .data-table tr:hover { background: #f8f9fa; }
                .efficiency-high { color: #27ae60; font-weight: 600; }
                .efficiency-medium { color: #f39c12; font-weight: 600; }
                .efficiency-low { color: #e74c3c; font-weight: 600; }
                .section-title { color: #2c3e50; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
                .no-data { text-align: center; padding: 20px; color: #7f8c8d; font-style: italic; }
            </style>
        </head>
        <body style="font-family: 'Poppins', Arial, sans-serif; margin:0; padding:0; background:#f5f7fa;">
            <div style="max-width: 1200px; margin:20px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:25px 0; text-align:center;">
                    <h1 style="margin:0; font-size:28px; font-weight:600;">📊 Daily Picklist Performance Report</h1>
                    <p style="margin:5px 0 0; opacity:0.9; font-size:14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <!-- Main Content -->
                <div style="padding:30px;">
                    
                    <!-- Overall Summary -->
                    <h2 class="section-title">📈 Overall Summary</h2>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-label">Total Picklists</div>
                            <div class="summary-value">${picklistReport.length}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">First Attempt Employees</div>
                            <div class="summary-value">${firstAttemptEmployeeSummary.length}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Second Attempt Employees</div>
                            <div class="summary-value">${secondAttemptEmployeeSummary.length}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Total Records Processed</div>
                            <div class="summary-value">${picklistReport.reduce((sum, item) => sum + (item.totalRecords || 0), 0)}</div>
                        </div>
                    </div>

                    <!-- Picklist-wise Report -->
                    <h2 class="section-title">📋 Picklist-wise Performance</h2>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Picklist ID</th>
                                    <th>Channel</th>
                                    <th>First Attempt Emp</th>
                                    <th>Second Attempt Emp</th>
                                    <th>Total Records</th>
                                    <th>Expected Found</th>
                                    <th>Actual Found (1st)</th>
                                    <th>Actual Found (2nd)</th>
                                    <th>Alter (1st)</th>
                                    <th>Alter (2nd)</th>
                                    <th>Efficiency (1st)</th>
                                    <th>Efficiency (2nd)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${picklistReport.length > 0 ? picklistReport.map(item => `
                                    <tr>
                                        <td>${item.picklist_id || 'N/A'}</td>
                                        <td>${item.channel || 'N/A'}</td>
                                        <td>${item.firstAttemptEmployeeId || 'N/A'}</td>
                                        <td>${item.secondAttemptEmployeeId || 'N/A'}</td>
                                        <td>${item.totalRecords || 0}</td>
                                        <td>${item.expectedToFound || 0}</td>
                                        <td>${item.actualFoundFirstAttempt || 0}</td>
                                        <td>${item.actualFoundSecondAttempt || 0}</td>
                                        <td>${item.firstAttemptAlterFound || 0}</td>
                                        <td>${item.secondAttemptAlterFound || 0}</td>
                                        <td class="${getEfficiencyClass(item.efficiencyFirstAttempt)}">${item.efficiencyFirstAttempt || 0}%</td>
                                        <td class="${getEfficiencyClass(item.efficiencySecondAttempt)}">${item.efficiencySecondAttempt || 0}%</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="12" class="no-data">No picklist data available for today</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <!-- First Attempt Employee Summary -->
                    <h2 class="section-title">👨‍💼 First Attempt Employee Performance</h2>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Picklists</th>
                                    <th>Total Records</th>
                                    <th>Expected Found</th>
                                    <th>Actual Found</th>
                                    <th>Alter</th>
                                    <th>Efficiency</th>
                                    <th>Channels</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${firstAttemptEmployeeSummary.length > 0 ? firstAttemptEmployeeSummary.map(emp => `
                                    <tr>
                                        <td>${emp.employee_id || 'N/A'}</td>
                                        <td>${emp.totalPicklists || 0}</td>
                                        <td>${emp.totalRecords || 0}</td>
                                        <td>${emp.totalExpectedToFound || 0}</td>
                                        <td>${emp.totalFound || 0}</td>
                                        <td>${emp.totalAlter || 0}</td>
                                        <td class="${getEfficiencyClass(emp.efficiency)}">${emp.efficiency || 0}%</td>
                                        <td>${(emp.channels || []).join(', ') || 'N/A'}</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="8" class="no-data">No first attempt employee data available for today</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <!-- Second Attempt Employee Summary -->
                    <h2 class="section-title">👨‍💼 Second Attempt Employee Performance</h2>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Picklists</th>
                                    <th>Total Records</th>
                                    <th>Actual Found</th>
                                    <th>Alter</th>
                                    <th>Channels</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${secondAttemptEmployeeSummary.length > 0 ? secondAttemptEmployeeSummary.map(emp => `
                                    <tr>
                                        <td>${emp.employee_id || 'N/A'}</td>
                                        <td>${emp.totalPicklists || 0}</td>
                                        <td>${emp.totalRecords || 0}</td>
                                        <td>${emp.totalFound || 0}</td>
                                        <td>${emp.totalAlter || 0}</td>
                                        <td>${(emp.channels || []).join(', ') || 'N/A'}</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="6" class="no-data">No second attempt employee data available for today</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <!-- Efficiency Analysis -->
                    <h2 class="section-title">📊 Efficiency Analysis</h2>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-label">Avg First Attempt Efficiency</div>
                            <div class="summary-value ${getEfficiencyClass(calculateAverageEfficiency(firstAttemptEmployeeSummary))}">
                                ${calculateAverageEfficiency(firstAttemptEmployeeSummary)}%
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Top Performer (1st)</div>
                            <div class="summary-value">
                                ${getTopPerformer(firstAttemptEmployeeSummary)}
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Most Active Channel</div>
                            <div class="summary-value">
                                ${getMostActiveChannel(picklistReport)}
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Total Alterations</div>
                            <div class="summary-value">
                                ${firstAttemptEmployeeSummary.reduce((sum, emp) => sum + (emp.totalAlter || 0), 0) + secondAttemptEmployeeSummary.reduce((sum, emp) => sum + (emp.totalAlter || 0), 0)}
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top:40px; text-align:center; color:#7f8c8d; font-size:12px; padding-top:20px; border-top:1px solid #e1e8ed;">
                        <p>Report generated on ${new Date().toLocaleString()}</p>
                        <p>Powered by <strong>Qurvii Logistics System</strong> | Performance Analytics</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        const recipients = [EMAIL_ADDRESS];
        // const recipients = ["neelima@qurvii.com", "dev@qurvii.com", "logistics@qurvii.com", "anu@qurvii.com", "kajal@qurvii.com"];

        const mailOptions = {
            from: `Qurvii Logistics <${EMAIL_ADDRESS}>`,
            to: recipients.join(", "),
            subject: `Daily Picklist Performance Report - ${new Date().toLocaleDateString()}`,
            html: htmlBody
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Picklist report email sent successfully");

        return {
            success: true,
            message: "Email sent successfully",
            picklistsCount: picklistReport.length,
            firstAttemptEmployees: firstAttemptEmployeeSummary.length,
            secondAttemptEmployees: secondAttemptEmployeeSummary.length
        };

    } catch (error) {
        console.error("Email sending error:", error);
        throw new Error("Failed to send picklist report email");
    }
};