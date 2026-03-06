import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_TRANSPORT === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Console transport for dev
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
}

export interface DigestData {
  managerName: string;
  managerEmail: string;
  teamName: string;
  period: string;
  teamAvg: number;
  membersAtRisk: Array<{ name: string; avg: number; trend: string }>;
}

export async function sendWeeklyDigest(data: DigestData): Promise<void> {
  const t = getTransporter();

  const atRiskHtml =
    data.membersAtRisk.length === 0
      ? '<p>No members flagged this week. 🎉</p>'
      : `<ul>${data.membersAtRisk.map((m) => `<li><strong>${m.name}</strong> — avg ${m.avg.toFixed(1)} (${m.trend})</li>`).join('')}</ul>`;

  const info = await t.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@tenly.app',
    to: data.managerEmail,
    subject: `Tenly Weekly Digest — ${data.teamName} (${data.period})`,
    html: `
      <h2>Hi ${data.managerName},</h2>
      <p>Here's your weekly Tenly digest for <strong>${data.teamName}</strong>.</p>
      <p><strong>Team average score:</strong> ${data.teamAvg.toFixed(1)} / 10</p>
      <h3>Members to check in with:</h3>
      ${atRiskHtml}
      <p style="color:#888;font-size:12px;">You're receiving this because you're a manager on Tenly.</p>
    `,
  });

  if (process.env.EMAIL_TRANSPORT !== 'smtp') {
    console.log('[EMAIL] Weekly digest (console transport):');
    console.log(`  To: ${data.managerEmail}`);
    console.log(`  Team: ${data.teamName} | Avg: ${data.teamAvg.toFixed(1)}`);
    console.log(`  At-risk: ${data.membersAtRisk.map((m) => m.name).join(', ') || 'none'}`);
  }
}
