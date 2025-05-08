const mqtt = require('mqtt');
require('dotenv').config(); // Load environment variables from .env file
const client = mqtt.connect(process.env.MQTT_SERVER_URL); // Replace with your MQTT broker URL

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

function publishMessage(topic, message) {
  client.publish(topic, message);
}

module.exports = { publishMessage };
