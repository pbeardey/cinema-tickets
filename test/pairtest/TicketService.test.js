import TicketService from '../../src/pairtest/TicketService.js';
import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException';
import winston from 'winston';
import crypto from 'crypto';
import TicketTypeRequest from '../../src/pairtest/lib/TicketTypeRequest';
import SeatReservationService from '../../src/thirdparty/seatbooking/SeatReservationService';
import TicketPaymentService from '../../src/thirdparty/paymentgateway/TicketPaymentService';

jest.spyOn(crypto, 'randomUUID').mockReturnValue('some-request-id');
const mockReserveSeat = jest
  .spyOn(SeatReservationService.prototype, 'reserveSeat')
  .mockImplementation(() => jest.fn());
const mockMakePayment = jest
  .spyOn(TicketPaymentService.prototype, 'makePayment')
  .mockImplementation(() => jest.fn());

const expectLog = (level = 'info') => {
  const request_id = 'some-request-id';
  return (message, extras = {}, nth) => {
    const expected = {
      level,
      message,
      request_id,
      ...extras,
    };
    if (nth) {
      expect(winston.mockLogger).toHaveBeenNthCalledWith(nth, expected);
    } else {
      expect(winston.mockLogger).toHaveBeenCalledWith(expected);
    }
  };
};

const TICKET_COST = new Map([
  ['ADULT', 25],
  ['CHILD', 15],
  ['INFANT', 0],
]);

const generate = (...params) => {
  const type = ['ADULT', 'CHILD', 'INFANT'];
  const requests = [];
  params.forEach((param, index) => {
    if (param > 0) {
      const request = new TicketTypeRequest(type[index], param);
      requests.push(request);
    }
  });

  const seatCount = params.reduce((acc, cur) => acc + cur, 0);
  const cost = params.reduce((acc, cur, index) => {
    return acc + cur * TICKET_COST.get(type[index]);
  }, 0);

  return {
    requests,
    seatCount,
    cost,
  };
};

const expectError = (error, errorMessage, logMessage) => {
  expect(error).toBeInstanceOf(InvalidPurchaseException);
  expect(error.message).toEqual(errorMessage);
  expectLog('error')(logMessage);
};

const expectedSeatsAndPayment = (accountId, seatCount, cost) => {
  expect(mockReserveSeat).toHaveBeenCalledWith(accountId, seatCount);
  expectLog()('Seats reserved.', { seats_reserved: seatCount }, 1);

  expect(mockMakePayment).toHaveBeenCalledWith(accountId, cost);
  expectLog()('Payment made.', { cost: cost }, 2);
};

describe('TicketService', () => {
  let ticketService;
  beforeEach(() => {
    ticketService = new TicketService();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  // single request
  it.each([['x'], [1.5], [-2], [true]])(
    'throws error when accountId is not a positive integer',
    (accountId) => {
      try {
        ticketService.purchaseTickets(accountId);
      } catch (error) {
        expectError(
          error,
          'Account Id must be a positive integer.',
          'Account Id provided was not an integer greater than 0.',
        );
      }
      expect.assertions(3);
    },
  );

  it('throws error when no ticket type request is made', () => {
    try {
      ticketService.purchaseTickets(1);
    } catch (error) {
      expectError(
        error,
        'A least one ticket type must be requested.',
        'Ticket type request is missing.',
      );
    }
    expect.assertions(3);
  });

  it('throws error when ticket type request is not of type ticketTypeRequest', () => {
    try {
      ticketService.purchaseTickets(1, {});
    } catch (error) {
      expectError(
        error,
        'Ticket type request is not recognised.',
        'Ticket type request is not of type ticketTypeRequest.',
      );
    }
    expect.assertions(3);
  });

  it.each([
    [1, 2],
    [2, 3],
  ])(
    'with account id %d, reserves %d seat(s) for adult ticket request',
    (accountId, noOfAdults) => {
      const adultTicketRequest = new TicketTypeRequest('ADULT', noOfAdults);

      ticketService.purchaseTickets(accountId, adultTicketRequest);

      expect(mockReserveSeat).toHaveBeenCalledWith(accountId, noOfAdults);
      expectLog()('Seats reserved.', { seats_reserved: noOfAdults });
    },
  );

  it.each([
    [2 * TICKET_COST.get('ADULT'), 2, 1],
    [3 * TICKET_COST.get('ADULT'), 3, 2],
  ])(
    'makes payment for %d for %d adults with account id %d',
    (expectedCost, noOfAdults, accountId) => {
      const adultTicketRequest = new TicketTypeRequest('ADULT', noOfAdults);

      ticketService.purchaseTickets(accountId, adultTicketRequest);

      expectedSeatsAndPayment(accountId, noOfAdults, expectedCost);
    },
  );

  // multiple requests
  it('throws error if any request is not of type ticketTypeRequest', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 1);
    const invalidTicketRequest = { type: 'ADULT', number: 2 };

    try {
      ticketService.purchaseTickets(
        1,
        adultTicketRequest,
        invalidTicketRequest,
      );
    } catch (error) {
      expectError(
        error,
        'Ticket type request is not recognised.',
        'Ticket type request is not of type ticketTypeRequest.',
      );
    }
    expect.assertions(3);
  });

  it('reserves seats and makes payment for multiple adults from multiple requests', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 1);

    ticketService.purchaseTickets(1, adultTicketRequest, adultTicketRequest);

    expectedSeatsAndPayment(1, 2, TICKET_COST.get('ADULT') * 2);
  });

  it('reserves seats and makes payment for adult and child requests', () => {
    const { requests, seatCount, cost } = generate(1, 1);
    ticketService.purchaseTickets(1, ...requests);

    expectedSeatsAndPayment(1, seatCount, cost);
  });

  it.each([
    [1, 3, 2, 1],
    [2, 10, 8, 7],
    [3, 4, 2, 4],
  ])(
    'reserves seats and makes payment for adult, child and infant requests',
    (accountId, adult, child, infant) => {
      const { requests, seatCount, cost } = generate(adult, child, infant);

      ticketService.purchaseTickets(accountId, ...requests);

      expectedSeatsAndPayment(accountId, seatCount, cost);
    },
  );

  it('throws error when no adult tickets are requested', () => {
    const { requests } = generate(0, 1);

    try {
      ticketService.purchaseTickets(1, ...requests);
    } catch (error) {
      expectError(
        error,
        'A minimum of one adult ticket is required.',
        'No adult ticket was requested.',
      );
    }
    expect.assertions(3);
  });

  it('throws error when more infants than adult tickets are requested', () => {
    const { requests } = generate(1, 0, 2);

    try {
      ticketService.purchaseTickets(1, ...requests);
    } catch (error) {
      expectError(
        error,
        'A minimum of one adult ticket per infant ticket is required.',
        'More adults than infants were requested.',
      );
    }
    expect.assertions(3);
  });

  it('throws error when more than 25 tickets are requested', () => {
    const { requests } = generate(10, 10, 6);

    try {
      ticketService.purchaseTickets(1, ...requests);
    } catch (error) {
      expectError(
        error,
        'A maximum of 25 tickets are permitted.',
        'More than 25 tickets were requested.',
      );
    }
    expect.assertions(3);
  });
});
