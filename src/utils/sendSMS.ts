import logger from './logger';

interface SMSOptions {
  to: string;
  message: string;
}

const sendSMS = async ({ to, message }: SMSOptions): Promise<void> => {
  try {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to });
    logger.info(`SMS sent to ${to}`);
  } catch (error) {
    logger.error(`SMS error: ${(error as Error).message}`);
  }
};

export default sendSMS;