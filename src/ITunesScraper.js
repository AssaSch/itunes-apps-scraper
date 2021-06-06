const fs = require('fs');
const readline = require('readline');
const logger = require('./logs/logger');
const DataFetcher = require('./DataFetcher');
const DataAggregator = require('./DataAggregator');
 
class ITunesScraper {
    /**
     * @param {string} textFilePath - Path to text file.
     * @param {number} batchSize    - Number of requests to send in each batch.
     */
    constructor({ textFilePath, batchSize } = {}) {
        if (!textFilePath) {
            throw new Error(`Path for text file was not provided!`);
        }
        this._batchSize = batchSize || 100;
        this._dataFetcher = new DataFetcher();
        this._dataAggregator = new DataAggregator();
        this._readInterface = readline.createInterface({
            input: fs.createReadStream(textFilePath),
        });
    }

    /**
     * Entry point of the application.
     * 1. Process text file and add applications descriptions to tf-idf corpus.
     * 3. Print applications descriptions highest scored words.
     * @returns {void}
     */
    async run() {
        await this._processFile();
        this._dataAggregator.printTopTfidfWordsPerApp(10);
    }

    /**
     * Read file line-by-line and send http requests to get apps descriptions.
     * Batch requests for better performance.
     * @returns {void}
     */
    async _processFile() {
        logger.info(`Start processing file.`);

        const numberOfIdsInRequest = 100;
        const requestPromises = [];
        let appsCounter = 0;
        let appsIdsString = '';

        for await (const line of this._readInterface) {
            appsIdsString += `${line},`;
            appsCounter++;
            if (appsCounter % numberOfIdsInRequest === 0) {
                requestPromises.push(this._dataFetcher.getAppsData(appsIdsString));
                appsIdsString = '';
            }
            if (requestPromises.length === this._batchSize) {
                const appsRequestsData = await Promise.all(requestPromises);
                appsRequestsData.forEach(appsData => this._dataAggregator.addAppsDescriptionsToCorpus(appsData));
                this._emptyArray(requestPromises);
            }
        } 

        await this._addRemainingAppsDescriptionsToCorpus(appsIdsString, requestPromises);

        logger.info(`Finished Adding all documents`);
    }
    
    /**
     * Send request for remaining apps ids and wait for all requests to finish.
     * @param {string} appsIdsString  - String of Itunes application id with comma delimited.
     * @param {array<Promise>} requestPromises - Array of requests promises to be resolved.
     * @returns {void}
     */
    async _addRemainingAppsDescriptionsToCorpus(appsIdsString, requestPromises) {
        if (appsIdsString) {
            requestPromises.push(this._dataFetcher.getAppsData(appsIdsString));
        }
        const appsRequestsData = await Promise.all(requestPromises);
        appsRequestsData.forEach(appsData => this._dataAggregator.addAppsDescriptionsToCorpus(appsData));
    }

    _emptyArray(arr) {
        arr.splice(0, arr.length);
    }
}

module.exports = ITunesScraper;
