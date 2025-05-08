const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { publishMessage } = require('../mqtt-service');
require('dotenv').config();
const logger = require('../utility/logger');


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

// initial model
const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    apiKey: process.env.GEMINI_API_KEY,
});


const handlemqttMessage = async (req, res) => {
    const { prompt } = req.body;

    // Check if the prompt is provided
    if (!prompt) {
        return res.status(400).send({ error: 'Prompt is required' });
    }
    logger.debug('[BODY] Prompt:', prompt);
    // classify the prompt using AI
    try {
        const { topic, status, responseAI } = await classifyPrompt(prompt);
        logger.debug('[LOG] Topic:', topic);
        logger.debug('[LOG] Status:', status);
        logger.debug('[LOG] Response from AI:', responseAI);

        // publish the message to the MQTT broker
        publishMessage(topic, status);

        // Send the response back to the client
        res.send({
            status: 'success',
            message: `Message sent to topic ${topic}: ${status}`,
            responseAI: responseAI // response from AI
        });
    } catch (error) {
        logger.error('[ERROR] Error classifying prompt:', error);
        res.status(500).send({ error: 'Error classifying prompt' });
    }

}


async function classifyPrompt(prompt) {
    try {
        // send the prompt to AI for classification
        const response = await callGemini(prompt);
        /**
         * Example response from AI classification
         * {
         *   topic: "rumah/kamar/lampu",
         *   status: "ON",
         *   responseAI: "Baik, lampu kamar dinyalakan."
         * }
         */
        return response;
    } catch (error) {
        logger.error('[ERROR] Error calling Gemini API:', error);
        throw new Error('Error classifying prompt');
    }
}

async function callGemini(prompt) {
    // Call the Gemini API with the prompt and return the response
    // This is a placeholder function. You need to implement the actual API call.
    try {
        const systemPrompt = `
        Kamu adalah asisten virtual yang membantu pengguna mengontrol perangkat rumah pintar.
        Tugas kamu adalah mengklasifikasikan perintah pengguna dan memberikan respons yang sesuai.
        Berikut adalah beberapa contoh perintah yang mungkin kamu terima:
        - "Nyalakan lampu di ruang tamu"
        - "Matikan lampu di kamar tidur"
        - "Nyalakan lampu dapur"
        - "Matikan lampu di ruang tamu"

        topik yang tersedia dalam perintah tersebut adalah:
        - rumah/lampu
        - rumah/ruangtamu/lampu
        - rumah/kamar/lampu
        - rumah/dapur/lampu
        - rumah/ruangtamu/lampu

        Jika topik tidak termasuk dalam daftar berikut, pilih yang paling mendekati:
        - rumah/lampu
        - rumah/ruangtamu/lampu
        - rumah/kamar/lampu
        - rumah/dapur/lampu
        - rumah/ruangtamu/lampu


        Berdasarkan perintah tersebut, kamu harus mengeluarkan topik dan status yang sesuai.
        Misalnya, untuk perintah "Nyalakan lampu di ruang tamu", kamu harus mengeluarkan:
        {
            topic: "rumah/ruangtamu/lampu",
            status: "ON",
            responseAI: "Baik, lampu ruang tamu dinyalakan."
        }
    `;

        // call the AI API with the prompt and systemPrompt
        const response = await model.call([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]);

        logger.debug('[RESPONSE] Sending Response From AI', response.content);
        const responseData = response.content;
        const cleanResponse = responseData
            .replace(/(\w+):/g, '"$1":') // quote keys
            .replace(/\\n/g, '')         // delete escape newline
            .replace(/\\"/g, '"')        // unescape quote
            .trim();

        return JSON.parse(cleanResponse); // Parse the response to get topic and status
    } catch (error) {
        logger.error('[ERROR] Error parsing Gemini response:', error);
        throw new Error('Error parsing Gemini response');
    }
}


module.exports = {
    handlemqttMessage
};