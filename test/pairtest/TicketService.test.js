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

  it.each([
    [1, 2],
    [2, 3],
  ])(
    'with account id %d, reserves %d seat(s) for adult ticket request',
    (accountId, noOfAdults) => {
      const adultTicketRequest = new TicketTypeRequest('ADULT', noOfAdults);

      ticketService.purchaseTickets(accountId, adultTicketRequest);

      expect(mockReserveSeat).toHaveBeenCalledWith(accountId, noOfAdults);
      expect(winston.mockLogger).toHaveBeenCalledWith({
        level: 'info',
        message: 'Seats reserved.',
        request_id: 'some-request-id',
        seats_reserved: noOfAdults,
      });
    },
  );

  it('makes correct payment one adult ticket request', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 1);

    ticketService.purchaseTickets(1, adultTicketRequest);

    expect(mockReserveSeat).toHaveBeenCalledWith(1, 1);
    expect(winston.mockLogger).toHaveBeenNthCalledWith(1,{
      level: 'info',
      message: 'Seats reserved.',
      request_id: 'some-request-id',
      seats_reserved: 1,
    });
    expect(mockMakePayment).toHaveBeenCalledWith(1, 25);
    expect(winston.mockLogger).toHaveBeenNthCalledWith(2,{
      level: 'info',
      message: 'Payment made.',
      request_id: 'some-request-id',
      cost: 25,
    });
  });
});
