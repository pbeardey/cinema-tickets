import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import logger from '../lib/logger';
import { randomUUID } from 'crypto';

export default class TicketService {
  #requestId;

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#requestId = randomUUID();

    logger.log({
      level: 'error',
      message: 'Account Id provided was not an integer greater than 0.',
      request_id: this.#requestId,
    });
    throw new InvalidPurchaseException(
      'Account Id must be a positive integer.',
    );
  }
}
