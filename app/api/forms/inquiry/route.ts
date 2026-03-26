import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Inquiry } from "@/models/Inquiry";
import { inquirySchema } from "@/lib/validators/inquiry";
import type { ApiResponse } from "@/types/api";
import { Resend } from "resend";

// -----------------------------
// Init Resend
// -----------------------------
const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSubmittedAt(date: Date) {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "UTC",
  }).format(date)} UTC`;
}

// -----------------------------
// POST /api/forms/inquiry
// -----------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // -----------------------------
    // Validate input
    // -----------------------------
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      const errorMessage =
        parsed.error.issues[0]?.message || "Invalid input";

      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: errorMessage },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // -----------------------------
    // Honeypot check (silent fail)
    // -----------------------------
    if (data.honeypot) {
      return NextResponse.json<ApiResponse<null>>({
        success: true,
        data: null,
      });
    }

    // -----------------------------
    // Strip honeypot before saving
    // -----------------------------
    const { honeypot, ...cleanData } = data;
    void honeypot;

    // -----------------------------
    // Save to DB
    // -----------------------------
    await connectDB();

    const inquiry = await Inquiry.create(cleanData);

    // -----------------------------
    // Send email (non-blocking failure)
    // -----------------------------
    try {
      const submittedAt = formatSubmittedAt(new Date());
      const reasonsHtml = cleanData.reasons
        .map((reason) => `<li>${escapeHtml(reason)}</li>`)
        .join("");

      await resend.emails.send({
        from: "Mela Space <onboarding@resend.dev>", // change later
        to: process.env.INQUIRY_EMAIL!, // set in env
        subject: "New Inquiry Submission",
        html: `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f7f7f8;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;background:#111827;color:#ffffff;">
          <h1 style="margin:0;font-size:18px;line-height:1.4;">New Inquiry Received</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;"><strong>Name:</strong> ${escapeHtml(cleanData.name)}</p>
          <p style="margin:0 0 12px;"><strong>Email:</strong> ${escapeHtml(cleanData.email)}</p>
          <p style="margin:0 0 8px;"><strong>Reasons:</strong></p>
          <ul style="margin:0 0 12px 18px;padding:0;">${reasonsHtml}</ul>
          <p style="margin:0 0 8px;"><strong>Message:</strong></p>
          <p style="margin:0 0 12px;white-space:pre-wrap;">${escapeHtml(cleanData.message)}</p>
          <p style="margin:0 0 12px;"><strong>Wants Reply:</strong> ${cleanData.wantsReply ? "Yes" : "No"}</p>
          <p style="margin:0 0 12px;"><strong>Allow Testimonial:</strong> ${cleanData.allowTestimonial ? "Yes" : "No"}</p>
          <p style="margin:0 0 12px;"><strong>Source:</strong> ${escapeHtml(cleanData.source || "N/A")}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <p style="margin:0;color:#6b7280;font-size:13px;"><strong>Submitted At:</strong> ${submittedAt}</p>
        </td>
      </tr>
    </table>
  </body>
</html>
        `,
        text: `
New Inquiry Received

Name: ${cleanData.name}
Email: ${cleanData.email}

Reasons:
${cleanData.reasons.map((r) => `- ${r}`).join("\n")}

Message:
${cleanData.message}

Wants Reply: ${cleanData.wantsReply ? "Yes" : "No"}
Allow Testimonial: ${cleanData.allowTestimonial ? "Yes" : "No"}

Source: ${cleanData.source || "N/A"}

Submitted At: ${submittedAt}
        `,
      });
    } catch (emailError) {
      console.error("INQUIRY EMAIL ERROR", emailError);
    }

    // -----------------------------
    // Success response
    // -----------------------------
    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: {
        id: inquiry._id.toString(),
      },
    });
  } catch (err) {
    console.error("INQUIRY POST ERROR", err);

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}