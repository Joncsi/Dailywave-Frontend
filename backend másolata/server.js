const app = require('./app');
const { config } = require('./config/dotenvConfig');

app.listen(config.PORT, config.HOSTNAME, () => {
    console.log(`IP: http://${config.HOSTNAME}:${config.PORT}`);
});