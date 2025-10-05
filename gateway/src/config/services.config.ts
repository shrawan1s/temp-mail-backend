export default () => ({
    services: {
        auth: process.env.AUTH_SERVICE_URL,
        mail: process.env.MAIL_SERVICE_URL,
        logger: process.env.LOGGER_SERVICE_URL,
    },
});
