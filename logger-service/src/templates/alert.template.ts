import { AlertTemplateProps } from 'src/schema/alert.schema';

export const generateAlertHTML = ({ service, level, occurrences, lastMessage }: AlertTemplateProps) => {
  const time = new Date().toISOString();
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Alert — ${service}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding: 24px; background: #f5f7fb;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 18px rgba(28,36,46,0.06);">
            <div style="padding: 20px 24px; background: linear-gradient(90deg, #ff6b6b, #ff8a5b); color: white;">
              <h1 style="margin: 0; font-size: 20px;">⚠️ ${service} — ${level.toUpperCase()} Alert</h1>
            </div>

            <div style="padding: 18px 24px;">
              <p style="margin: 0 0 12px 0; color: #333;">
                <strong>Occurrences:</strong> ${occurrences}
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>Time:</strong> ${time}
              </p>

              <table style="width:100%; margin-top:12px; border-collapse: collapse;">
                <tr>
                  <td style="padding:12px; background:#fafafa; border-radius:6px;">
                    <strong>Service</strong><br/>
                    <div style="color:#0b1220;">${service}</div>
                  </td>
                  <td style="padding:12px; margin-left:8px; background:#fafafa; border-radius:6px;">
                    <strong>Level</strong><br/>
                    <div style="color:#0b1220;">${level}</div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:14px;">
                <strong>Last log message</strong>
                <pre style="background:#0f1724; color:#e6edf3; padding:12px; border-radius:6px; overflow-x:auto; font-family: Menlo, Monaco, 'Courier New', monospace;">
${escapeHtml(lastMessage || '')}
                </pre>
              </div>

              <p style="margin:16px 0 0 0; font-size:12px; color:#666;">This is an automated alert from Temp Mail Logger Service.</p>
            </div>

            <div style="padding: 12px 20px; background: #fbfbfd; text-align:center; font-size:12px; color:#888;">
              Service: ${service} • Environment: ${process.env.NODE_ENV || 'unknown'}
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

/** small helper to avoid raw HTML injection in emails */
function escapeHtml(s: string) {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
