const axios = require('axios');
const axiosRetry = require('axios-retry');
const logger = require('./logs/logger');
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
 
class DataFetcher {
    /**
     * @param {object} httpClient - Client to use for http requests. Use "axios" as default.
     */
    constructor({ httpClient } = {}) {
        this._client = httpClient || axios;
    }

    /**
     * Get applications data from itunes app store.
     * @param {string} appsIdsString - String of Itunes application id with comma delimited.
     * @returns {array<object>}      - Array of applications data objects.
     */
    async getAppsData(appsIdsString) {
        logger.info(`Getting data for apps ${appsIdsString}.`);
        try {
            if (!appsIdsString) {
                logger.error(`Please provide apps ids to use in request`);
                return null;
            }
            const appsInfo = await this._client.get(`${DataFetcher._ITUNES_APP_LOOKUP_ENDPOINT}?id=${appsIdsString}`);
            if (!appsInfo.data || !appsInfo.data.resultCount) {
                logger.error(`Apps with ids: ${appsIds} does not exist!`);
                return null;
            }

            return appsInfo.data.results;
        } catch (err) {
            logger.error(`Failed adding apps ${appsIdsString} to corpus: Error: ${err.message}, Stack: ${err.stack}`);
        }
    }
    
}

DataFetcher._ITUNES_APP_LOOKUP_ENDPOINT = 'http://itunes.apple.com/lookup';

module.exports = DataFetcher;
