const express = require('express');
const { handlemqttMessage } = require('./controllers/mqtt-controller');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 3001;

const app = express();

app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins (you can specify a specific origin if needed)
    methods: ['GET', 'POST'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));


app.post('/api/lampu', handlemqttMessage);

app.listen(port, () => console.log(`Server berjalan di port ${port}`));