// src/services/emailService.js
require('dotenv').config();
const nodemailer  = require('nodemailer');
const path        = require('path');
const pool        = require('../config/db');
const renderTemplate = require('../utils/renderTemplate');
const { htmlToText } = require('html-to-text');           // NEW
const { logNotification } = require('./notificationService');

// Create transporter for Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const logoPath = path.join(__dirname, '../assets/logo.png');

async function sendPhotographerAlert(ev, photographerEmail, photographerName, options = {}) {
  const { template = 'photographerReminder' } = options;

  // fetch school name
  const { rows: schRows } = await pool.query(
    'SELECT name FROM schools WHERE id = $1',
    [ev.school_id]
  );
  const schoolName    = schRows[0]?.name || 'Unknown School';
  const dateFormatted = new Date(ev.event_date).toLocaleDateString();

  // render HTML
  const html = renderTemplate(template, {
    event: { name: ev.name, dateFormatted, schoolName },
    photographerName,
  });

  // send email
  await transporter.sendMail({
    from: '"Roz&Kirsty Team" <manishtomar.sde@gmail.com>',
    to: photographerEmail,
    subject: `[${ev.name} @ ${schoolName}] Photo session reminder`,
    html,
    attachments: [{ filename: 'logo.png', path: logoPath, cid: 'logo' }],
  });

  // convert to plain-text
  const text = htmlToText(html, {
    wordwrap: false,
    selectors: [{ selector: 'img', format: 'skip' }]
  });

  // log in DB
  try {
    const { rows: userRows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [photographerEmail]
    );
    const userId = userRows[0]?.id;
    if (userId) {
      await logNotification({
        userId,
        eventId: ev.id,
        type: 'photographer_assignment',
        message: text,
        deliveryType: 'email',
      });
    }
  } catch (err) {
    console.error('Error logging photographer notification:', err);
  }
}

async function sendParentsAlert(ev, parents, options = {}) {
  const { template = 'parentReminder' } = options;

  // fetch school name
  const { rows: schRows } = await pool.query(
    'SELECT name FROM schools WHERE id = $1',
    [ev.school_id]
  );
  const schoolName    = schRows[0]?.name || 'Unknown School';
  const dateFormatted = new Date(ev.event_date).toLocaleDateString();

  // group children per parent
  const parentMap = {};
  parents.forEach(p => {
    if (!parentMap[p.email]) {
      parentMap[p.email] = { ...p, childNames: [p.childName] };
    } else if (!parentMap[p.email].childNames.includes(p.childName)) {
      parentMap[p.email].childNames.push(p.childName);
    }
  });

  // loop over each parent
  for (const parent of Object.values(parentMap)) {
    // render HTML
    const html = renderTemplate(template, {
      event: { name: ev.name, dateFormatted, schoolName },
      parent,
      childNames: parent.childNames,
      isMultiChild: parent.childNames.length > 1,
    });

    // send email
    await transporter.sendMail({
      from: '"Roz&Kirsty Team" <manishtomar.sde@gmail.com>',
      to: parent.email,
      subject: `[${ev.name} @ ${schoolName}] Photo session reminder`,
      html,
      attachments: [{ filename: 'logo.png', path: logoPath, cid: 'logo' }],
    });

    // convert to plain-text
    const text = htmlToText(html, {
      wordwrap: false,
      selectors: [{ selector: 'img', format: 'skip' }]
    });

    // log in DB
    try {
      const { rows: userRows } = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [parent.email]
      );
      const userId = userRows[0]?.id;
      if (userId) {
        await logNotification({
          userId,
          eventId: ev.id,
          type: 'preference_request',
          message: text,
          deliveryType: 'email',
        });
      }
    } catch (err) {
      console.error(`Error logging notification for parent ${parent.email}:`, err);
    }
  }
}

module.exports = {
  sendPhotographerAlert,
  sendParentsAlert,
};
