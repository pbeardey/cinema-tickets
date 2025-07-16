jest.mock('winston', () => {
  const mockLogger = jest.fn();
  return {
    createLogger: jest.fn(() => {
      return {
        log: mockLogger,
      };
    }),
    transports: {
      Console: jest.fn(),
    },
    mockLogger,
  };
});

// process.env.TICKET_COST_ADULT = 30;
// process.env.TICKET_COST_CHILD = 20;
// process.env.TICKET_COST_INFANT = 10;
