const { publishMessage } = require('../mqtt-service'); // Adjust the path as necessary


// first clasification prompt with AI
// const prompt = 'Nyalakan lampu di ruang tamu'; // Example prompt
// for get topic check first with AI
// const topic = getTopic(prompt); // Example topic
// then check again with AI for status
// const status = getStatus(prompt); // Example status
// publishMessage(topic, status); // Publish the message to the MQTT broker
// Example of a contextual message structure
// const message ={
//     topic: 'rumah/lampu',
//     status: 'ON',
//     responseAI: 'lampu dinyalakan', // Default response from AI
// }

// topic includes 'rumah/lampu', 'rumah/ruangtamu/lampu', 'rumah/kamar/lampu', 'rumah/dapur/lampu'
// status includes 'ON' or 'OFF'

const handlemqttMessage = (req, res) => {
    const { prompt } = req.body;

    const message = {
        topic: '',
        status: '',
        responseAI: '',
    };

    // Check if the prompt is provided
    if (!prompt) {
        return res.status(400).send({ error: 'Prompt is required' });
    }

    // classify the prompt using AI
    const { topic, status, responseAI } = classifyPrompt(prompt);

    // publish the message to the MQTT broker
    publishMessage(topic, status);

    // Send the response back to the client
    res.send({
        status: 'success',
        message: `Message sent to topic ${topic}: ${status}`,
        responseAI: responseAI // response from AI
    });
}


async function classifyPrompt(prompt) {
    // send the prompt to AI for classification
    // const response = await callGemini(prompt);
    /**
     * Example response from AI classification
     * {
     *   topic: "rumah/kamar/lampu",
     *   status: "ON",
     *   responseAI: "Baik, lampu kamar dinyalakan."
     * }
     */
    return response;
}

module.exports = {
    handlemqttMessage
};