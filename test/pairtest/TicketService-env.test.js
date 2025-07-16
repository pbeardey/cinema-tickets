import setEnv, { resetEnv } from '../helpers/set-env';
import TicketTypeResponse from '../../src/pairtest/lib/TicketTypeRequest';
import SeatReservationService from '../../src/thirdparty/seatbooking/SeatReservationService';
import TicketPaymentService from '../../src/thirdparty/paymentgateway/TicketPaymentService';
import TicketService from '../../src/pairtest/TicketService';

const originalEnv = setEnv.originalEnv;

const spyReserveSeat = jest
  .spyOn(SeatReservationService.prototype, 'reserveSeat')
  .mockImplementation(() => jest.fn());

const spyMakePayment = jest
  .spyOn(TicketPaymentService.prototype, 'makePayment')
  .mockImplementation(() => jest.fn());

describe('integration-test', () => {
  it('reserves seats and make payment successfully', () => {
    const accountId = 12;
    const expectedCost = 1400;
    const ticketService = new TicketService();

    const adultTicketRequest = new TicketTypeResponse('ADULT', 3);
    const childTicketRequest = new TicketTypeResponse('CHILD', 2);
    const infantTicketRequest = new TicketTypeResponse('INFANT', 1);

    ticketService.purchaseTickets(
      accountId,
      adultTicketRequest,
      childTicketRequest,
      infantTicketRequest,
    );

    expect(spyReserveSeat).toHaveBeenCalledWith(accountId, 6);
    expect(spyMakePayment).toHaveBeenCalledWith(accountId, expectedCost);
  });
});

resetEnv(originalEnv);
