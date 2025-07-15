import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import logger from '../lib/logger';
import { randomUUID } from 'crypto';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService';

export default class TicketService {
  #requestId;
  #accountId;
  #ticketTypeRequests;

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#requestId = randomUUID();
    this.#accountId = accountId;
    this.#ticketTypeRequests = ticketTypeRequests;

    if (!Number.isInteger(this.#accountId) || this.#accountId < 1) {
      this.#log().error(
        'Account Id provided was not an integer greater than 0.',
      );
      throw new InvalidPurchaseException(
        'Account Id must be a positive integer.',
      );
    }

    if (this.#ticketTypeRequests.length === 0) {
      this.#log().error('Ticket type request is missing.');
      throw new InvalidPurchaseException(
        'A least one ticket type must be requested.',
      );
    }

    if (!(this.#ticketTypeRequests[0] instanceof TicketTypeRequest)) {
      this.#log().error(
        'Ticket type request is not of type ticketTypeRequest.',
      );
      throw new InvalidPurchaseException(
        'Ticket type request is not recognised.',
      );
    }

    const seatReservationService = new SeatReservationService();
    seatReservationService.reserveSeat(1, 1);
    this.#log().info('Seats reserved.', { seats_reserved: 1 });
  }

  #log = () => {
    const _logger = (level, message, extras) => {
      logger.log({
        level,
        message,
        request_id: this.#requestId,
        ...extras,
      });
    };

    return {
      error: (message, extras = {}) => _logger('error', message, extras),
      info: (message, extras) => _logger('info', message, extras),
    };
  };
}
