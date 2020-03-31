import { findLintViolations, FindLintViolationsResult } from "./find-lint-violations";

describe("find lint violations", () => {
  let findLintViolationsResult: FindLintViolationsResult;
  let errorMock: jest.Mock;
  let warnMock: jest.Mock;

  beforeEach(() => {
    errorMock = jest.fn();
    warnMock = jest.fn();
  })

  describe("when rule not specified", () => {
    beforeEach(() => {
      const groupedLintErrors = [
        {
          name: "error",
          violations: [{ message: "error_msg" }]
        }
      ];

      const spotConfig = {
        rules: {}
      };

      findLintViolationsResult  = findLintViolations(groupedLintErrors, spotConfig, {
        error: errorMock,
        warn: warnMock
      });
    });

    it("should only trigger an error", () => {
      expect(findLintViolationsResult.errorCount).toBe(1);
      expect(findLintViolationsResult.warningCount).toBe(0);
      expect(errorMock).toBeCalled();
      expect(warnMock).not.toBeCalled();
    });
  });

  describe("when rule is specified as a warning", () => {
    beforeEach(() => {
      const groupedLintErrors = [
        {
          name: "error",
          violations: [{ message: "error_msg" }]
        }
      ];

      const spotConfig = {
        rules: {
          error: "warn"
        }
      };

      findLintViolationsResult = findLintViolations(groupedLintErrors, spotConfig, {
        error: errorMock,
        warn: warnMock
      });
    });

    it("should only trigger a warning", () => {
      expect(findLintViolationsResult.errorCount).toBe(0);
      expect(findLintViolationsResult.warningCount).toBe(1);
      expect(warnMock).toBeCalled();
      expect(errorMock).not.toBeCalled();
    });
  });

  describe("when rule is specified as a error", () => {
    beforeEach(() => {
      const groupedLintErrors = [
        {
          name: "error",
          violations: [{ message: "error_msg" }]
        }
      ];

      const spotConfig = {
        rules: {
          error: "error"
        }
      };

      findLintViolationsResult = findLintViolations(groupedLintErrors, spotConfig, {
        error: errorMock,
        warn: warnMock
      });
    });

    it("should only trigger a error", () => {
      expect(findLintViolationsResult.errorCount).toBe(1);
      expect(findLintViolationsResult.warningCount).toBe(0);
      expect(errorMock).toBeCalled();
      expect(warnMock).not.toBeCalled();
    });
  });

  describe("when rule is specified as disabled", () => {
    beforeEach(() => {
      const groupedLintErrors = [
        {
          name: "error",
          violations: [{ message: "error_msg" }]
        }
      ];

      const spotConfig = {
        rules: {
          error: "off"
        }
      };

      findLintViolationsResult = findLintViolations(groupedLintErrors, spotConfig, {
        error: errorMock,
        warn: warnMock
      });
    });

    it("should trigger no errors and no warnings", () => {
      expect(findLintViolationsResult.errorCount).toBe(0);
      expect(findLintViolationsResult.warningCount).toBe(0);
      expect(errorMock).not.toBeCalled();
      expect(warnMock).not.toBeCalled();
    });
  });

  describe("when rule setting is invalid", () => {
    beforeEach(() => {
      const groupedLintErrors = [
        {
          name: "error",
          violations: [{ message: "error_msg" }]
        }
      ];

      const spotConfig = {
        rules: {
          error: "invalid"
        }
      };

      findLintViolationsResult = findLintViolations(groupedLintErrors, spotConfig, {
        error: errorMock,
        warn: warnMock
      });
    });

    it("should trigger only a error", () => {
      expect(findLintViolationsResult.errorCount).toBe(1);
      expect(findLintViolationsResult.warningCount).toBe(0);
      expect(errorMock).toBeCalled();
      expect(warnMock).not.toBeCalled();
    });
  });

  describe("when there are no lint violations", () => {
    beforeEach(() => {
      const spotConfig = {
        rules: {
          error: "invalid"
        }
      };

      findLintViolationsResult = findLintViolations([], spotConfig, {
        error: errorMock,
        warn: warnMock
      });
    });

    it("should trigger no errors and no warnings", () => {
      expect(findLintViolationsResult.errorCount).toBe(0);
      expect(findLintViolationsResult.warningCount).toBe(0);
      expect(errorMock).not.toBeCalled();
      expect(warnMock).not.toBeCalled();
    });
  });
});
