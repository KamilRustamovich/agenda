const { Agenda } = require('@hokify/agenda');
const { MongoClient } = require('mongodb');

const mongoConnectionString = 'mongodb://localhost:27017/agenda';

(async function() {
  const client = await MongoClient.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db();


  const agenda = new Agenda({ mongo: db });

  agenda.define('printToConsole', async (job, done) => {
    const attempt = job.attrs.data.attempt || 1;

    try {
      const message = job.attrs.data.message || 'Hello, World!';
      console.log(`Message: ${message}`);
      done();
    } catch (err) {
      if (attempt < 24) {
        console.log(`Error: ${err.message}, scheduling a new attempt`);
        const nextAttempt = attempt + 1;
        await agenda.schedule('1 hour from now', 'printToConsole', { message: job.attrs.data.message, attempt: nextAttempt });
      } else {
        console.error(`Error: ${err.message}, 24 attempts failed`);
      }
      
      done(err);
    }
  });

  agenda.on('ready', async () => {
    await agenda.schedule('1 second from now', 'printToConsole', { message: 'My custom message!' });

    agenda.start();
  });

  agenda.on('fail', (err, job) => {
    console.log(`Job ${job.attrs.name} failed with error: ${err.message}`);
  });

  agenda.on('complete', (job) => {
    console.log(`Job ${job.attrs.name} completed`);
  });
})();