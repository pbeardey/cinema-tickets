import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import logger from '../lib/logger';
import { randomUUID } from 'crypto';

export default class TicketService {
  #requestId;
  #accountId;
  #ticketTypeRequests;

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#requestId = randomUUID();
    this.#accountId = accountId;
    this.#ticketTypeRequests = ticketTypeRequests;

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

    if (this.#ticketTypeRequests.length === 0) {
      logger.log({
        level: 'error',
        message: 'Ticket type request is missing.',
        request_id: this.#requestId,
      });
      throw new InvalidPurchaseException(
        'A least one ticket type must be requested.',
      );
    }

    logger.log({
      level: 'error',
      message: 'Ticket type request is not of type ticketTypeRequest.',
      request_id: this.#requestId,
    });
    throw new InvalidPurchaseException(
      'Ticket type request is not recognised.',
    );
  }
}
