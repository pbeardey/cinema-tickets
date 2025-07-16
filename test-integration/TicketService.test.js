import TicketTypeResponse from '../src/pairtest/lib/TicketTypeRequest';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService';
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService';
import TicketService from '../src/pairtest/TicketService';

jest.unmock('winston');

const spyReserveSeat = jest.spyOn(
  SeatReservationService.prototype,
  'reserveSeat',
);
const spyMakePayment = jest.spyOn(
  TicketPaymentService.prototype,
  'makePayment',
);

describe('integration-test', () => {
  it('reserves seats and make payment successfully', () => {
    const accountId = 12;
    const expectedCost = 105; // use 140 with process.env in setup.js
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
