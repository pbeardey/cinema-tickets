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
