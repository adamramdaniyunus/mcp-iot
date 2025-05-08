const express = require('express');
const { handlemqttMessage } = require('./controllers/mqtt-controller');
const app = express();
app.use(express.json());

app.post('/api/lampu', handlemqttMessage);

app.listen(3001, () => console.log('Server berjalan di port 3001'));