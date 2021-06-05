const logger = require('./src/logs/logger');
const ITunesScraper = require('./src/ITunesScraper');

const textFilePath = process.argv[2];
const iTunesScraper = new ITunesScraper({ textFilePath });
iTunesScraper.run()
.then(() => {
    logger.info(`Run successfuly.`);
})
.catch((err) => {
    logger.error(`Failed running: Error: ${err.message}, Stack: ${err.stack}`);
});

