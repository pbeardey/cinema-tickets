import TicketService from '../../src/pairtest/TicketService.js';
import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException';
import winston from 'winston';
import crypto from 'crypto';

jest.spyOn(crypto, 'randomUUID').mockReturnValue('some-request-id');

describe('TicketService', () => {
  it.each([['x'], [1.5], [-2], [true]])(
    'throws error when accountId is not a positive integer',
    (accountId) => {
      try {
        const ticketService = new TicketService();
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
});
