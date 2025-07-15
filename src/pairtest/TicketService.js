import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import logger from '../lib/logger';
import { randomUUID } from 'crypto';

export default class TicketService {
  #requestId;
  #accountId;

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#requestId = randomUUID();
    this.#accountId = accountId;

    if (!Number.isInteger(this.#accountId) || this.#accountId < 1) {
      logger.log({
        level: 'error',
        message: 'Account Id provided was not an integer greater than 0.',
        request_id: this.#requestId,
      });
      throw new InvalidPurchaseException(
        'Account Id must be a positive integer.',
      );
    }

    logger.log({
      level: 'error',
      message: 'Ticket type request is missing.',
      request_id: this.#requestId,
    });
    throw new InvalidPurchaseException(
      'A least one ticket type must be requested.',
    );
  }
}
