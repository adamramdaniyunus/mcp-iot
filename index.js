const express = require('express');
const { handlemqttMessage } = require('./controllers/mqtt-controller');
require('dotenv').config();

const port = process.env.PORT || 3001;

const app = express();

app.use(express.json());

app.post('/api/lampu', handlemqttMessage);

app.listen(port, () => console.log(`Server berjalan di port ${port}`));