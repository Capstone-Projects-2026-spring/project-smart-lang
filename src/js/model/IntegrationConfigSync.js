class IntegrationConfigSync {
    /**
     * @param {Object} data
     * @param {PodcastInfo[]} data.podcasts
     */
    constructor(data = {}) {
        this.podcasts = data.podcasts || [];
    }
}

export { IntegrationConfigSync };