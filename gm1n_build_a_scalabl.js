// Import required libraries and tools
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const axios = require('axios');

// Define the chatbot integrator class
class ScalableChatbotIntegrator {
  constructor() {
    this.botId = uuidv4();
    this.bots = {};
    this.wsServer = new WebSocket.Server({ port: 8080 });
    this.app = express();
    this.app.use(express.json());

    // Define routes for bot registration and message handling
    this.app.post('/register-bot', (req, res) => {
      const { botName, botUrl } = req.body;
      this.bots[botName] = botUrl;
      res.send(`Bot ${botName} registered successfully!`);
    });

    this.app.post('/message', (req, res) => {
      const { message, chatId } = req.body;
      this.handleMessage(message, chatId);
      res.send(`Message handled successfully!`);
    });

    // Define WebSocket connection logic
    this.wsServer.on('connection', (ws) => {
      console.log('New WebSocket connection established!');

      // Handle incoming messages from clients
      ws.on('message', (message) => {
        this.handleMessage(message, ws.upgradeReq.params.chatId);
      });

      // Handle errors and disconnections
      ws.on('error', (err) => console.error('WebSocket error:', err));
      ws.on('close', () => console.log('WebSocket connection closed.'));
    });
  }

  // Handle incoming messages and forward them to the appropriate bot
  handleMessage(message, chatId) {
    const botName = chatId.split(':')[0];
    const botUrl = this.bots[botName];
    axios.post(botUrl, { message })
      .then((response) => {
        console.log(`Received response from bot ${botName}:`, response.data);
        this.wsServer.clients.forEach((client) => {
          if (client.upgradeReq.params.chatId === chatId) {
            client.send(response.data);
          }
        });
      })
      .catch((error) => console.error(`Error sending message to bot ${botName}:`, error));
  }
}

// Create an instance of the chatbot integrator and start the server
const integrator = new ScalableChatbotIntegrator();
integrator.app.listen(3000, () => console.log('Server started on port 3000.'));