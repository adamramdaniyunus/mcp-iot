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
    logger.info('[BODY] Prompt:', prompt);
    // classify the prompt using AI
    try {
        const { topic, status, responseAI } = await classifyPrompt(prompt);
        logger.debug('[LOG] Topic:', topic);
        logger.debug('[LOG] Status:', status);
        logger.debug('[LOG] Response from AI:', responseAI);

        // hit hardware tools like esp32, esp8266, etc.
        // topic includes 'rumah/lampu', 'rumah/ruangtamu/lampu', 'rumah/kamar/lampu', 'rumah/dapur/lampu'
        // status includes 'ON' or 'OFF'
        // publish the message to the MQTT broker
        // in esp32, esp8266, etc. subscribe to the topic and get the status
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

        Tugas kamu:
        1. Mengklasifikasikan perintah pengguna menjadi 'topic' dan 'status'.
        2. Memberikan respons alami dan menyenangkan yang sesuai konteks.

        Topik yang tersedia:
        - rumah/lampu
        - rumah/ruangtamu/lampu
        - rumah/kamar/lampu
        - rumah/dapur/lampu

        Jika tidak cocok, pilih topik yang paling mendekati.

        Format output harus seperti berikut:
        {
            topic: "topik_yang_sesuai",
            status: "ON" atau "OFF",
            responseAI: "respons santai, alami, dan menyenangkan sesuai status dan topik"
        }

        Contoh:
        Perintah: "Matikan lampu kamar"
        Output:
        {
            topic: "rumah/kamar/lampu",
            status: "OFF",
            responseAI: "Siap, lampu kamar sudah dimatikan. Tidur nyenyak ya!"
        }

        Kamu boleh variasikan gaya bicara dalam 'responseAI', selama:
        - Masih sesuai konteks 'topic' dan 'status'
        - Tetap terdengar ramah dan membantu
        - Tidak kaku atau berulang-ulang

    `;

        // call the AI API with the prompt and systemPrompt
        const response = await model.call([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]);

        logger.info('[RESPONSE] Sending Response From AI', response.content);
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