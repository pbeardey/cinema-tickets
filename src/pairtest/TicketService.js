import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import logger from '../lib/logger';
import { randomUUID } from 'crypto';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';

export default class TicketService {
  #requestId;
  #seatReservationService = new SeatReservationService();
  #paymentService = new TicketPaymentService();
  static #ADULT_TICKET_COST = 25;

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#requestId = randomUUID();

    this.#validateAccountId(accountId);

    this.#validateTicketTypeRequest(ticketTypeRequests);

    const noOfAdults = ticketTypeRequests[0].getNoOfTickets();

    this.#reserveSeats(accountId, noOfAdults);

    this.#makePayment(accountId, noOfAdults);
  }

  #validateAccountId = (accountId) => {
    if (!Number.isInteger(accountId) || accountId < 1) {
      this.#log().error(
        'Account Id provided was not an integer greater than 0.',
      );
      throw new InvalidPurchaseException(
        'Account Id must be a positive integer.',
      );
    }
  };

  #validateTicketTypeRequest = (ticketTypeRequests) => {
    if (ticketTypeRequests.length === 0) {
      this.#log().error('Ticket type request is missing.');
      throw new InvalidPurchaseException(
        'A least one ticket type must be requested.',
      );
    }

    if (!(ticketTypeRequests[0] instanceof TicketTypeRequest)) {
      this.#log().error(
        'Ticket type request is not of type ticketTypeRequest.',
      );
      throw new InvalidPurchaseException(
        'Ticket type request is not recognised.',
      );
    }
  };

  #reserveSeats = (accountId, numberOfTickets) => {
    this.#seatReservationService.reserveSeat(accountId, numberOfTickets);
    this.#log().info('Seats reserved.', { seats_reserved: numberOfTickets });
  };

  #makePayment = (accountId, numberOfTickets) => {
    const cost = numberOfTickets * TicketService.#ADULT_TICKET_COST;
    this.#paymentService.makePayment(accountId, cost);
    this.#log().info('Payment made.', { cost });
  };

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
