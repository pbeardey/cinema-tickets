const originalEnv = { ...process.env };

export const setEnv = () => {
  process.env.TICKET_COST_ADULT = 300;
  process.env.TICKET_COST_CHILD = 200;
  process.env.TICKET_COST_INFANT = 100;
  return originalEnv;
};

export default {
  originalEnv: setEnv(),
};

export const resetEnv = (originalEnvVars) => {
  process.env = { ...originalEnvVars };
};
