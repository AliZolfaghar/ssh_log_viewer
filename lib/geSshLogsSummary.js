import fs from 'fs';
import readline from 'readline';
import os from 'os';

export async function geSshLogsSummary() {
  const isLinux = process.platform === 'linux';
  const logPath = isLinux ? '/var/log/auth.log' : null;

  if (!isLinux || !fs.existsSync(logPath)) {
    console.warn('⛔ این فانکشن فقط روی لینوکس قابل اجراست و مسیر لاگ پیدا نشد.');
    return [];
  }

  const accepted = /Accepted (\w+) for (\w+) from ([\d.]+) port (\d+)/;
  const failed = /Failed (\w+) for (invalid user )?(\w+) from ([\d.]+) port (\d+)/;

  const summary = {}; // ساختار: { ip: { success: n, failure: n, usernames: Set } }

  const rl = readline.createInterface({
    input: fs.createReadStream(logPath),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    let ip, user, status;

    if (line.includes('Accepted')) {
      const match = accepted.exec(line);
      if (match) {
        const [_, method, username, ipAddr] = match;
        ip = ipAddr;
        user = username;
        status = 'success';
      }
    } else if (line.includes('Failed')) {
      const match = failed.exec(line);
      if (match) {
        const [_, method, invalid, username, ipAddr] = match;
        ip = ipAddr;
        user = username;
        status = 'failure';
      }
    }

    if (ip && user && status) {
      if (!summary[ip]) {
        summary[ip] = {
          success: 0,
          failure: 0,
          usernames: new Set()
        };
      }
      summary[ip][status]++;
      summary[ip].usernames.add(user);
    }
  }

  // تبدیل به آرایه قابل نمایش
  const result = Object.entries(summary).map(([ip, data]) => ({
    ip,
    success: data.success,
    failure: data.failure,
    usernames: Array.from(data.usernames).join(', ')
  }));

  return result;
}
