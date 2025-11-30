const cron = require('node-cron');
const pool = require('../config/db');
const {
  listUpcomingEventsForJob,
  markPhotographerSentByJob,
  markParentsSentByJob,
  getEventParticipants,
} = require('../services/eventService');
const {
  sendPhotographerAlert,
  sendParentsAlert,
} = require('../services/emailService');

async function sendUpcomingAlerts() {
  const nowTs = new Date().toISOString();
  const events = await listUpcomingEventsForJob(7);

  for (const ev of events) {
    // photographer
    if (!ev.notify_photographer_job_sent && ev.photographer_id) {
      const { rows: users } = await pool.query(
        'SELECT name, email FROM users WHERE id = $1',
        [ev.photographer_id]
      );
      if (users[0]) {
        await sendPhotographerAlert(
          ev,
          users[0].email,
          users[0].name,
          { template: 'photographerScheduledReminder' }
        );
        await markPhotographerSentByJob(ev.id);
        console.log(`${nowTs} - Sent scheduled photographer alert for event ${ev.id}`);
      }
    }

    // parents
    if (!ev.notify_parents_job_sent) {
      const { data } = await getEventParticipants(ev.id, { page: 1, limit: 10000 });
      if (data.length) {
        const rows = data.map(r => ({
          name: r.parent_name,
          email: r.parent_email,
          childName: r.student_name,
        }));
        await sendParentsAlert(ev, rows, { template: 'parentScheduledReminder' });
        await markParentsSentByJob(ev.id);
        console.log(`${nowTs} - Sent scheduled parents alert for event ${ev.id}`);
      }
    }
  }
}

cron.schedule('0 8 * * *', sendUpcomingAlerts, {
  scheduled: true,
  timezone: 'Europe/London',
});
console.log(`Scheduled sendUpcomingAlerts job at ${new Date().toISOString()}`);