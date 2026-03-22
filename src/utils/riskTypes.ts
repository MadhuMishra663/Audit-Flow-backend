export const getRiskScore = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return 10;
    case "HIGH":
      return 7;
    case "MEDIUM":
      return 5;
    case "LOW":
      return 3;
    default:
      return 0;
  }
};
