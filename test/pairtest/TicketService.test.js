import TicketService from '../../src/pairtest/TicketService.js';
import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException';
import winston from 'winston';
import crypto from 'crypto';

jest.spyOn(crypto, 'randomUUID').mockReturnValue('some-request-id');

describe('TicketService', () => {
  let ticketService;
  beforeEach(() => {
    ticketService = new TicketService();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([['x'], [1.5], [-2], [true]])(
    'throws error when accountId is not a positive integer',
    (accountId) => {
      try {
        ticketService.purchaseTickets(accountId);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidPurchaseException);
        expect(error.message).toEqual('Account Id must be a positive integer.');
        expect(winston.mockLogger).toHaveBeenCalledWith({
          level: 'error',
          message: 'Account Id provided was not an integer greater than 0.',
          request_id: 'some-request-id',
        });
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
      expect(winston.mockLogger).toHaveBeenCalledWith({
        level: 'error',
        message: 'Ticket type request is missing.',
        request_id: 'some-request-id',
      });
    }
    expect.assertions(3);
  });

  it('throws error when ticket type request is not of type ticketTypeRequest', () => {
    try {
      ticketService.purchaseTickets(1, {});
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toEqual('Ticket type request is not recognised.');
      expect(winston.mockLogger).toHaveBeenCalledWith({
        level: 'error',
        message: 'Ticket type request is not of type ticketTypeRequest.',
        request_id: 'some-request-id',
      });
    }
    expect.assertions(3);
  });
});
