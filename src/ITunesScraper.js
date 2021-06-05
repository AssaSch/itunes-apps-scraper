const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const natural = require('natural');
const logger = require('./logs/logger');
const TfIdf = natural.TfIdf;
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
 
class ITunesScraper {
    /**
     * @param {string} textFilePath  - Path to text file.
     * @param {object} httpClient    - Client to use for http requests. Use "axios" as default.
     * @param {object} TfIdfInstance - Library to use for tf-idf calculation. Use TfIdf from "natural" npm package as default.
     * @param {number} batchSize     - Number of requests to send in each batch.
     */
    constructor({ textFilePath, httpClient, TfIdfInstance, batchSize } = {}) {
        if (!textFilePath) {
            throw new Error(`Path for text file was not provided!`);
        }
        this._client = httpClient || axios;
        this._tfidf = TfIdfInstance || new TfIdf();
        this._batchSize = batchSize || 100;
        this._appIds = [];
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
        this._printTopTfidfWordsPerApp(10);
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
                requestPromises.push(this._addAppsDescriptionsToCorpus(appsIdsString));
                appsIdsString = '';
            }
            if (requestPromises.length === this._batchSize) {
                await Promise.all(requestPromises);
                this._emptyArray(requestPromises);
            }
        } 

        await this._getRemainingAppsData(appsIdsString, requestPromises);

        logger.info(`Finished Adding all documents`);
    }
    
    /**
     * Add application description to tf-idf corpus.
     * @param {string} appsIdsString - String of Itunes application id with comma delimited.
     * @returns {void}
     */
    async _addAppsDescriptionsToCorpus(appsIdsString) {
        try {
            const appsInfo = await this._client.get(`${ITunesScraper._ITUNES_APP_LOOKUP_ENDPOINT}?id=${appsIdsString}`);
            if (!appsInfo.data || !appsInfo.data.resultCount) {
                logger.warn(`Apps with ids: ${appsIds} does not exist!`);
                return;
            }

            for (const appData of appsInfo.data.results) {
                this._tfidf.addDocument(appData.description);
                this._appIds.push(appData.trackId);
                logger.info(`Finished Adding app ${appData.trackId} to corpus.`);
            }
        } catch (err) {
            logger.error(`Failed adding apps ${appsIds} to corpus: Error: ${err.message}, Stack: ${err.stack}`);
        }
    }

    /**
     * Print top tf-idf words for each application description.
     * @param {string} numberOfTopWords - Number of top words to print for each application description.
     * @returns {void}
     */
    _printTopTfidfWordsPerApp(numberOfTopWords) {
        const numbersAfterTheDot = 4;
        for (let i = 0; i < this._appIds.length; i++) {
            const appTermsList = this._tfidf.listTerms(i);
            let topAppWords = `${this._appIds[i]}: `;
            for (let j = 0; j < numberOfTopWords && appTermsList[j]; j++) {
                topAppWords += `${appTermsList[j].term} ${appTermsList[j].tfidf.toFixed(numbersAfterTheDot)}`;
                if (j !== numberOfTopWords - 1) {
                    topAppWords += ', '
                }
            }
            logger.info(topAppWords);
        }
    }

    /**
     * Send request for remaining apps ids and wait for all requests to finish.
     * @param {string} appsIdsString - String of Itunes application id with comma delimited.
     * @param {array} requestPromises - Array of requests promises to be resolved.
     * @returns {void}
     */
    async _getRemainingAppsData(appsIdsString, requestPromises) {
        if (appsIdsString) {
            requestPromises.push(this._addAppsDescriptionsToCorpus(appsIdsString));
        }
        await Promise.all(requestPromises);
    }

    _emptyArray(arr) {
        arr.splice(0, arr.length);
    }
}

ITunesScraper._ITUNES_APP_LOOKUP_ENDPOINT = 'http://itunes.apple.com/lookup';

module.exports = ITunesScraper;
