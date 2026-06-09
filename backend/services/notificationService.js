require('dotenv').config();
const twilio = require('twilio');

// Initialize Twilio client if credentials are provided
let twilioClient = null;
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_SMS,
  TWILIO_FROM_WHATSAPP,
  OWNER_PHONE_NUMBER
} = process.env;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('Twilio Notification Service initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err.message);
  }
} else {
  console.log('Twilio credentials not found. Notification Service is running in SIMULATION MODE.');
}

// Global active notifications list for the admin dashboard notifications panel
const notificationLogs = [];

const notificationService = {
  getNotificationLogs() {
    return notificationLogs;
  },

  addLog(type, channel, recipient, content, status = 'Sent (Simulated)') {
    const log = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      type,        // 'Owner Alert', 'Customer Update'
      channel,     // 'WhatsApp', 'SMS', 'Browser'
      recipient,   // Phone number or 'Browser Dashboard'
      content,
      status
    };
    notificationLogs.unshift(log); // newest first
    // Limit to past 100 logs
    if (notificationLogs.length > 100) {
      notificationLogs.pop();
    }
    return log;
  },

  // 1. Send New Order Alert to Owner
  async notifyOwnerNewOrder(order) {
    const itemsText = order.items
      .map(item => `${item.quantity} ${item.name}`)
      .join('\n');

    const messageContent = `NEW ORDER RECEIVED\n\n` +
      `Order #${order.order_id}\n\n` +
      `Customer: ${order.customer_name}\n` +
      `Phone: ${order.phone_number}\n\n` +
      `${itemsText}\n\n` +
      `Total: ₹${order.total_price.toFixed(2)}\n\n` +
      `Pickup at: Gopi Fast Food Center\n` +
      `Address: Quality Inn Ramachandra Opposite, Duvvada Road, Kurmannapalem, Visakhapatnam, PIN 530046\n` +
      `Contact: 9392119020 (WhatsApp)\n`;

    console.log('\n======================================');
    console.log('SIMULATED OWNER NOTIFICATION SENT');
    console.log('======================================');
    console.log(messageContent);
    console.log('======================================\n');

    const results = {
      whatsapp: { success: false, detail: 'Not attempted (Simulation)' },
      sms: { success: false, detail: 'Not attempted (Simulation)' }
    };

    // Owner WhatsApp (Primary Channel)
    const whatsappRecipient = OWNER_PHONE_NUMBER || 'Restaurant Owner';
    if (twilioClient && TWILIO_FROM_WHATSAPP && OWNER_PHONE_NUMBER) {
      try {
        const fromWhatsApp = TWILIO_FROM_WHATSAPP.startsWith('whatsapp:') 
          ? TWILIO_FROM_WHATSAPP 
          : `whatsapp:${TWILIO_FROM_WHATSAPP}`;
        const toWhatsApp = OWNER_PHONE_NUMBER.startsWith('whatsapp:') 
          ? OWNER_PHONE_NUMBER 
          : `whatsapp:${OWNER_PHONE_NUMBER}`;

        await twilioClient.messages.create({
          body: messageContent,
          from: fromWhatsApp,
          to: toWhatsApp
        });
        results.whatsapp = { success: true, detail: 'Sent via Twilio' };
        this.addLog('Owner Alert', 'WhatsApp', toWhatsApp, messageContent, 'Sent');
      } catch (err) {
        results.whatsapp = { success: false, detail: err.message };
        this.addLog('Owner Alert', 'WhatsApp', whatsappRecipient, messageContent, 'Failed: ' + err.message);
      }
    } else {
      this.addLog('Owner Alert', 'WhatsApp', whatsappRecipient, messageContent, 'Sent (Simulated)');
    }

    // Owner SMS (Secondary Channel)
    if (twilioClient && TWILIO_FROM_SMS && OWNER_PHONE_NUMBER) {
      try {
        const toSMS = OWNER_PHONE_NUMBER.replace('whatsapp:', '');
        await twilioClient.messages.create({
          body: messageContent,
          from: TWILIO_FROM_SMS,
          to: toSMS
        });
        results.sms = { success: true, detail: 'Sent via Twilio' };
        this.addLog('Owner Alert', 'SMS', toSMS, messageContent, 'Sent');
      } catch (err) {
        results.sms = { success: false, detail: err.message };
        this.addLog('Owner Alert', 'SMS', whatsappRecipient, messageContent, 'Failed: ' + err.message);
      }
    } else {
      this.addLog('Owner Alert', 'SMS', whatsappRecipient, messageContent, 'Sent (Simulated)');
    }

    return results;
  },

  // 2. Send Order Received Message to Customer
  async notifyCustomerOrderReceived(order) {
    const messageContent = `Your order #${order.order_id} has been received at Gobites by Gopal.\nPickup from Gopi Fast Food Center (Quality Inn Ramachandra Opposite, Duvvada Road, Kurmannapalem, Visakhapatnam, PIN 530046).\nEstimated preparation time: ${order.estimated_time} minutes.\nContact: 9392119020 (WhatsApp)\nUPI ID: gch08087-9@okicici`;

    console.log(`[Customer Notification (Order Received) to ${order.phone_number}]: ${messageContent}`);

    if (twilioClient && TWILIO_FROM_SMS) {
      try {
        await twilioClient.messages.create({
          body: messageContent,
          from: TWILIO_FROM_SMS,
          to: order.phone_number
        });
        this.addLog('Customer Update', 'SMS', order.phone_number, messageContent, 'Sent');
      } catch (err) {
        console.error('Failed to send Customer SMS:', err.message);
        this.addLog('Customer Update', 'SMS', order.phone_number, messageContent, 'Failed: ' + err.message);
      }
    } else {
      this.addLog('Customer Update', 'SMS', order.phone_number, messageContent, 'Sent (Simulated)');
    }
  },

  // 3. Send Order Ready Message to Customer
  async notifyCustomerOrderReady(order) {
    const messageContent = `Your order #${order.order_id} is ready for pickup at Gobites by Gopal!\nAddress: Gopi Fast Food Center, Quality Inn Ramachandra Opposite, Duvvada Road, Kurmannapalem, Visakhapatnam, PIN 530046.\nContact: 9392119020 (WhatsApp)\nUPI ID: gch08087-9@okicici`;

    console.log(`[Customer Notification (Order Ready) to ${order.phone_number}]: ${messageContent}`);

    if (twilioClient && TWILIO_FROM_SMS) {
      try {
        await twilioClient.messages.create({
          body: messageContent,
          from: TWILIO_FROM_SMS,
          to: order.phone_number
        });
        this.addLog('Customer Update', 'SMS', order.phone_number, messageContent, 'Sent');
      } catch (err) {
        console.error('Failed to send Customer SMS:', err.message);
        this.addLog('Customer Update', 'SMS', order.phone_number, messageContent, 'Failed: ' + err.message);
      }
    } else {
      this.addLog('Customer Update', 'SMS', order.phone_number, messageContent, 'Sent (Simulated)');
    }
  }
};

module.exports = notificationService;
