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
  static #CHILD_TICKET_COST = 15;

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#requestId = randomUUID();

    this.#validateAccountId(accountId);

    this.#validateTicketTypeRequest(ticketTypeRequests);

    const ticketTally = this.#summariseRequests(ticketTypeRequests);

    this.#validateTicketTally(ticketTally);

    this.#reserveSeats(accountId, ticketTally);

    this.#makePayment(accountId, ticketTally);
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

    ticketTypeRequests.forEach((request) => {
      if (!(request instanceof TicketTypeRequest)) {
        this.#log().error(
          'Ticket type request is not of type ticketTypeRequest.',
        );
        throw new InvalidPurchaseException(
          'Ticket type request is not recognised.',
        );
      }
    });
  };

  #summariseRequests = (requests) => {
    const ticketTally = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0,
    };
    requests.forEach((request) => {
      const type = request.getTicketType();
      ticketTally[type] = ticketTally[type] + request.getNoOfTickets();
    });

    return ticketTally;
  };

  #validateTicketTally = (ticketTally) => {
    if (ticketTally.ADULT < 1) {
      this.#log().error('No adult ticket was requested.');
      throw new InvalidPurchaseException(
        'A minimum of one adult ticket is required.',
      );
    }

    if (ticketTally.ADULT < ticketTally.INFANT) {
      this.#log().error('More adults than infants were requested.');
      throw new InvalidPurchaseException(
        'A minimum of one adult ticket per infant ticket is required.',
      );
    }

    const totalTickets =
      ticketTally.ADULT + ticketTally.CHILD + ticketTally.INFANT;
    if (totalTickets > 25) {
      this.#log().error('More than 25 tickets were requested.');
      throw new InvalidPurchaseException(
        'A maximum of 25 tickets are permitted.',
      );
    }
  };

  #reserveSeats = (accountId, ticketTab) => {
    let totalSeats = 0;
    for (const type in ticketTab) {
      totalSeats = totalSeats + ticketTab[type];
    }
    this.#seatReservationService.reserveSeat(accountId, totalSeats);
    this.#log().info('Seats reserved.', { seats_reserved: totalSeats });
  };

  #makePayment = (accountId, ticketTab) => {
    let cost =
      ticketTab.ADULT * TicketService.#ADULT_TICKET_COST +
      ticketTab.CHILD * TicketService.#CHILD_TICKET_COST;
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
