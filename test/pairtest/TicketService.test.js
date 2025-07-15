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
        expect(error).toBeInstanceOf(InvalidPurchaseException);
        expect(error.message).toEqual('Account Id must be a positive integer.');
        expectLog('error')(
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
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toEqual(
        'A least one ticket type must be requested.',
      );
      expectLog('error')('Ticket type request is missing.');
    }
    expect.assertions(3);
  });

  it('throws error when ticket type request is not of type ticketTypeRequest', () => {
    try {
      ticketService.purchaseTickets(1, {});
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toEqual('Ticket type request is not recognised.');
      expectLog('error')(
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
    [50, 2, 1],
    [75, 3, 2],
  ])(
    'makes payment for %d for %d adults with account id %d',
    (expectedCost, noOfAdults, accountId) => {
      const adultTicketRequest = new TicketTypeRequest('ADULT', noOfAdults);

      ticketService.purchaseTickets(accountId, adultTicketRequest);

      expect(mockReserveSeat).toHaveBeenCalledWith(accountId, noOfAdults);
      expectLog()('Seats reserved.', { seats_reserved: noOfAdults }, 1);

      expect(mockMakePayment).toHaveBeenCalledWith(accountId, expectedCost);
      expectLog()('Payment made.', { cost: expectedCost }, 2);
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
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toEqual('Ticket type request is not recognised.');
      expectLog('error')(
        'Ticket type request is not of type ticketTypeRequest.',
      );
    }
    expect.assertions(3);
  });

  it('reserves seats and makes payment for multiple adults from multiple requests', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 1);

    ticketService.purchaseTickets(1, adultTicketRequest, adultTicketRequest);

    expect(mockReserveSeat).toHaveBeenCalledWith(1, 2);
    expectLog()('Seats reserved.', { seats_reserved: 2 }, 1);

    expect(mockMakePayment).toHaveBeenCalledWith(1, 50);
    expectLog()('Payment made.', { cost: 50 }, 2);
  });
});
