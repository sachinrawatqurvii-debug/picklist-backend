import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import nodemailer from "nodemailer"

const EMAIL_ADDRESS = "sachinrawatqurvii@gmail.com";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const sendNotificationToEmail = async (req, res, next) => {
    const payload = req.body;
    if (payload.length === 0 || typeof payload !== "object") {
        return next(new ApiError(400, "Payload must be non-empty object"));
    }
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: EMAIL_ADDRESS,
                pass: EMAIL_PASSWORD,
            }
        });

        // const payload = {
        //     Channel: "Test",
        //     TotalOrders: 50,
        //     FoundInInventory: 20,
        //     Alter: [{
        //         "Total Quantity": 2,
        //         items: [
        //             { "Style Number": 12022, "Size": "3XL" },
        //             { "Style Number": 12035, "Size": "2XL" },
        //             { "Style Number": 16022, "Size": "3XL" },
        //             { "Style Number": 19102, "Size": "2XL" }
        //         ]
        //     }],
        //     NoFabric: [{
        //         "Total Quantity": 2,
        //         items: [
        //             { "Style Number": 14022, "Size": "4XL" },
        //             { "Style Number": 18025, "Size": "XL" }
        //         ]
        //     }],
        //     Cutting: 19,
        //     "Picklist Search By": "Store helper"
        // };



        const renderValue = (value) => {
            if (typeof value === "number" || typeof value === "string") {
                return `<span style="font-weight: ${typeof value === 'number' ? '600' : '400'}; 
                color: ${typeof value === 'number' ? '#2c3e50' : '#333'};">
                ${value}
            </span>`;
            }
            if (Array.isArray(value)) {
                return value.map(v => `
            <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; margin-bottom: 6px; color: #2c3e50;">
                    Total Qty: ${v["Total Quantity"]}
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Style Number</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${v.items.map(item => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${item["Style Number"]}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${item["Size"]}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `).join("");
            }
            if (typeof value === "object" && value !== null) {
                return `<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 13px; overflow-x: auto;">
                ${JSON.stringify(value, null, 2)}
            </pre>`;
            }
            return "";
        };

        const htmlBody = `
         <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
    </style>
     <div style="font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <!-- Header -->
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📦 Daily Orders Report</h1>
        </div>
        
        <!-- Summary Card -->
        <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Summary Overview</h3>
            <p style="margin-bottom: 0;">
                Channel: <strong>${payload.Channel}</strong> | 
                Total Orders: <strong style="color: #e74c3c;">${payload.TotalOrders}</strong> | 
                Found in Inventory: <strong style="color: #27ae60;">${payload.FoundInInventory}</strong>
            </p>
        </div>
        
        <!-- Main Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #34495e; color: white;">
                    <th style="padding: 12px; text-align: left; width: 30%;">Category</th>
                    <th style="padding: 12px; text-align: left;">Details</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(payload).map(([key, value]) => `
                    <tr style="border-bottom: 1px solid #ecf0f1;">
                        <td style="padding: 12px; vertical-align: top; font-weight: 600; color: #2c3e50;">${key}</td>
                        <td style="padding: 12px; vertical-align: top;">${renderValue(value)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
        
        <!-- Status Highlights -->
        <div style="display: flex; margin: 20px 0; gap: 10px;">
            <div style="flex: 1; background-color: #fff8e1; padding: 10px; border-left: 4px solid #ffc107;">
                <h4 style="margin: 0 0 5px 0; color: #ff9800;">Alter Needed</h4>
                <p style="margin: 0; font-size: 14px;">${payload.Alter[0]["Total Quantity"]} items</p>
            </div>
            <div style="flex: 1; background-color: #ffebee; padding: 10px; border-left: 4px solid #f44336;">
                <h4 style="margin: 0 0 5px 0; color: #e53935;">No Fabric</h4>
                <p style="margin: 0; font-size: 14px;">${payload.NoFabric[0]["Total Quantity"]} items</p>
            </div>
            <div style="flex: 1; background-color: #e8f5e9; padding: 10px; border-left: 4px solid #4caf50;">
                <h4 style="margin: 0 0 5px 0; color: #43a047;">Cutting</h4>
                <p style="margin: 0; font-size: 14px;">${payload.Cutting} items</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d;">
            <p style="margin: 0;">Generated by Qurvii Logistics System</p>
           <p style="margin: 5px 0 0 0;">
   ${new Date().toLocaleString()}
            

</p>
        </div>
    </div>
`;



        const recipients = [
            // "logistics@qurvii.com",
            // "kajal@qurvii.com",
            // "anu@qurvii.com",
            // "neelima@qurvii.com"
            EMAIL_ADDRESS
        ];

        // Send all emails in parallel
        const emailPromises = recipients.map(email => {
            const mailOptions = {
                from: `Orders Report <${EMAIL_ADDRESS}>`,
                to: email,
                subject: `${payload?.Channel} Daily Orders Summary`,
                html: htmlBody
            };

            return transporter.sendMail(mailOptions)
                .then(info => {
                    console.log("Email sent to:", email, info.response);
                    return { email, success: true, info };
                })
                .catch(err => {
                    console.error("Failed for:", email, err);
                    return { email, success: false, error: err };
                });
        });

        // Wait for all emails to complete
        const results = await Promise.all(emailPromises);

        // Check if any failed
        const failedEmails = results.filter(r => !r.success);
        if (failedEmails.length > 0) {
            console.error("Failed to send to some emails:", failedEmails);
            // You might want to handle this differently
        }


        // Send success response
        res.status(200).json(new ApiResponse(200, {
            sentCount: results.filter(r => r.success).length,
            failedCount: failedEmails.length,
            results
        }, "Email sending completed"));

    } catch (error) {
        next(error);
    }
}

const health = (req, res, next) => {
    res.status(200).json(new ApiResponse(200, { health: "I am health" }, "Health route fetched successfully"))
}



export { sendNotificationToEmail, health };
