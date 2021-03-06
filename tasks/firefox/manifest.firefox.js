const BUILD_ENVS_MAP = {
    dev: 'browserassistantdev@adguard.com',
    beta: 'browserassistantbeta@adguard.com',
    release: 'browserassistant@adguard.com',
};

module.exports = {
    applications: {
        gecko: {
            id: BUILD_ENVS_MAP[process.env.BUILD_ENV],
            strict_min_version: '54.0',
        },
    },
    background: {
        page: 'background.html',
    },
};
