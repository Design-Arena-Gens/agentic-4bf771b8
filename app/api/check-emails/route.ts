import { NextRequest, NextResponse } from 'next/server';

const emailCache = new Map<string, Set<string>>();

export async function POST(request: NextRequest) {
  try {
    const { email, password, imapHost, imapPort } = await request.json();

    if (!email || !password || !imapHost || !imapPort) {
      return NextResponse.json(
        { error: 'Missing required configuration' },
        { status: 400 }
      );
    }

    const cacheKey = email;
    if (!emailCache.has(cacheKey)) {
      emailCache.set(cacheKey, new Set());
    }
    const seenEmails = emailCache.get(cacheKey)!;

    // Simulate email checking with mock data for demo
    // In production, this would use the imap library to connect to the email server
    const mockEmails = [
      {
        id: `email-${Date.now()}-${Math.random()}`,
        from: 'colleague@example.com',
        subject: 'Project Update',
        timestamp: new Date().toLocaleString(),
        preview: 'The latest project milestone has been completed. Please review the attached documents...',
        messageId: `<${Date.now()}@example.com>`
      }
    ];

    // Randomly decide if there's a new email (20% chance for demo purposes)
    const hasNewEmail = Math.random() < 0.2;

    const newEmails = hasNewEmail
      ? mockEmails.filter(email => {
          if (!seenEmails.has(email.messageId)) {
            seenEmails.add(email.messageId);
            return true;
          }
          return false;
        })
      : [];

    // Clean up old entries (keep last 1000)
    if (seenEmails.size > 1000) {
      const toDelete = Array.from(seenEmails).slice(0, seenEmails.size - 1000);
      toDelete.forEach(id => seenEmails.delete(id));
    }

    return NextResponse.json({
      success: true,
      newEmails,
      totalChecked: seenEmails.size
    });

  } catch (error) {
    console.error('Error checking emails:', error);
    return NextResponse.json(
      { error: 'Failed to check emails: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

/* Production IMAP implementation would look like:

import Imap from 'imap';
import { simpleParser } from 'mailparser';

const imap = new Imap({
  user: email,
  password: password,
  host: imapHost,
  port: parseInt(imapPort),
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

return new Promise((resolve, reject) => {
  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) reject(err);

      const searchCriteria = ['UNSEEN'];
      imap.search(searchCriteria, (err, results) => {
        if (err) reject(err);

        if (results.length === 0) {
          imap.end();
          resolve([]);
          return;
        }

        const fetch = imap.fetch(results, { bodies: '' });
        const emails = [];

        fetch.on('message', (msg) => {
          msg.on('body', (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (!err) {
                emails.push({
                  id: parsed.messageId,
                  from: parsed.from?.text || '',
                  subject: parsed.subject || '',
                  timestamp: parsed.date?.toLocaleString() || '',
                  preview: parsed.text?.substring(0, 150) || ''
                });
              }
            });
          });
        });

        fetch.once('end', () => {
          imap.end();
          resolve(emails);
        });
      });
    });
  });

  imap.once('error', reject);
  imap.connect();
});
*/
