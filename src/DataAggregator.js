const logger = require('./logs/logger');
const natural = require('natural');
const TfIdf = natural.TfIdf;
 
class DataAggregator {
    /**
     * @param {object} TfIdfInstance - Library to use for tf-idf calculation. Use TfIdf from "natural" npm package as default.
     */
    constructor({ TfIdfInstance } = {}) {
        this._tfidf = TfIdfInstance || new TfIdf();
        this._appIds = [];
    }

    /**
     * Add applications descriptions to tf-idf corpus.
     * @param {array<object>} appsData - Array of applications data objects.
     * @returns {void}
     */
    async addAppsDescriptionsToCorpus(appsData) {
        for (const app of appsData) {
            this._tfidf.addDocument(app.description);
            this._appIds.push(app.trackId);
            logger.info(`Finished Adding app ${app.trackId} to corpus.`);
        }
    }

    /**
     * Print top tf-idf words for each application description.
     * @param {string} numberOfTopWords - Number of top words to print for each application description.
     * @returns {void}
     */
    printTopTfidfWordsPerApp(numberOfTopWords) {
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
}

module.exports = DataAggregator;
