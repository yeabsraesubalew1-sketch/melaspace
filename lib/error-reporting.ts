import { Resend } from "resend";

interface ReportableError {
  path: string;
  message: string;
  stack?: string;
  digest?: string;
  source?: "public" | "admin" | "global" | "api";
  context?: Record<string, unknown>;
}

async function trySaveErrorToDb(error: ReportableError): Promise<boolean> {
  try {
    const [{ connectDB }, { ErrorLog }] = await Promise.all([
      import("@/lib/db"),
      import("@/models/ErrorLog"),
    ]);

    await connectDB();
    await ErrorLog.create({
      ...error,
      stack: error.stack?.slice(0, 15000),
      message: error.message.slice(0, 5000),
      path: error.path.slice(0, 300),
      digest: error.digest?.slice(0, 300),
    });

    return true;
  } catch {
    return false;
  }
}

async function tryEmailError(error: ReportableError): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY_ERROR;
    const toEmail = process.env.ERROR_EMAIL;

    if (!apiKey || !toEmail) {
      return false;
    }

    const resend = new Resend(apiKey);

    const subjectSource = error.source ? `[${error.source}] ` : "";

    await resend.emails.send({
      from: "Mela Space Errors <onboarding@resend.dev>",
      to: toEmail,
      subject: `${subjectSource}Application error at ${error.path}`,
      html: `
        <h2>Application error reported</h2>
        <p><strong>Path:</strong> ${error.path}</p>
        <p><strong>Message:</strong> ${error.message}</p>
        <p><strong>Digest:</strong> ${error.digest ?? "N/A"}</p>
        <p><strong>Source:</strong> ${error.source ?? "unknown"}</p>
        <pre style="white-space: pre-wrap;">${error.stack ?? "No stack"}</pre>
        <pre style="white-space: pre-wrap;">${JSON.stringify(error.context ?? {}, null, 2)}</pre>
      `,
    });

    return true;
  } catch {
    return false;
  }
}

export async function reportAppError(error: ReportableError): Promise<void> {
  try {
    const saved = await trySaveErrorToDb(error);

    if (saved) {
      return;
    }

    await tryEmailError(error);
  } catch {
    // silent fail by requirement
  }
}
