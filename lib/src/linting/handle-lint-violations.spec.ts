import { handleLintViolations } from './handle-lint-violations'

describe('handle lint violations', () => {
  let deferExit: boolean;
  let errorMock: jest.Mock;
  let warnMock: jest.Mock;

  describe('lint violation when rule not specified', () => {
    beforeEach(() => {
      errorMock = jest.fn();
      warnMock = jest.fn();

      const groupedLintErrors = [
        {
          name: 'error',
          violations: [
            { message: 'error_msg' }
          ]
        }
      ]

      const spotConfig = {
        rules: {}
      }

      deferExit = handleLintViolations(
        groupedLintErrors,
        spotConfig,
        { error: errorMock, warn: warnMock }
      )
    });

    it('should return deferExit true', () => {
      expect(deferExit).toBe(true);
    })

    it('should call errorMock', () => {
      expect(errorMock).toBeCalled();
    })

    it('should not call warnMock', () => {
      expect(warnMock).not.toBeCalled();
    });
  })

  describe('lint violation when rule is specified as a warning', () => {
    beforeEach(() => {
      errorMock = jest.fn();
      warnMock = jest.fn();

      const groupedLintErrors = [
        {
          name: 'error',
          violations: [
            { message: 'error_msg' }
          ]
        }
      ]

      const spotConfig = {
        rules:  {
          error: 'warn',
        }
      }

      deferExit = handleLintViolations(
        groupedLintErrors,
        spotConfig,
        { error: errorMock, warn: warnMock }
      )
    });

    it('should return deferExit false', () => {
      expect(deferExit).toBe(false);
    })

    it('should call warnMock', () => {
      expect(warnMock).toBeCalled();
    })

    it('should not call errorMock', () => {
      expect(errorMock).not.toBeCalled();
    });
  });

  describe('lint violation when rule is specificed as a error', () => {
    beforeEach(() => {
      errorMock = jest.fn();
      warnMock = jest.fn();

      const groupedLintErrors = [
        {
          name: 'error',
          violations: [
            { message: 'error_msg' }
          ]
        }
      ]

      const spotConfig = {
        rules:  {
          error: 'error',
        }
      }

      deferExit = handleLintViolations(
        groupedLintErrors,
        spotConfig,
        { error: errorMock, warn: warnMock }
      )
    });

    it('should return deferExit true', () => {
      expect(deferExit).toBe(true);
    })

    it('should call errorMock', () => {
      expect(errorMock).toBeCalled();
    })

    it('should not call warnMock', () => {
      expect(warnMock).not.toBeCalled();
    });
  });

  describe('lint violation when rule is specified as disabled', () => {
    beforeEach(() => {
      errorMock = jest.fn();
      warnMock = jest.fn();

      const groupedLintErrors = [
        {
          name: 'error',
          violations: [
            { message: 'error_msg' }
          ]
        }
      ]

      const spotConfig = {
        rules:  {
          error: 'off',
        }
      }

      deferExit = handleLintViolations(
        groupedLintErrors,
        spotConfig,
        { error: errorMock, warn: warnMock }
      )
    });

    it('should return deferExit false', () => {
      expect(deferExit).toBe(false);
    });

    it('should not call errorMock', () => {
      expect(errorMock).not.toBeCalled();
    });

    it('should not call warnMock', () => {
      expect(warnMock).not.toBeCalled();
    });
  });

  describe('lint violation when rule setting is invalid', () => {
    beforeEach(() => {
      errorMock = jest.fn();
      warnMock = jest.fn();

      const groupedLintErrors = [
        {
          name: 'error',
          violations: [
            { message: 'error_msg' }
          ]
        }
      ]

      const spotConfig = {
        rules:  {
          error: 'invalid',
        }
      }

      deferExit = handleLintViolations(
        groupedLintErrors,
        spotConfig,
        { error: errorMock, warn: warnMock }
      )
    });

    it('should return deferExit true', () => {
      expect(deferExit).toBe(true);
    })

    it('should call errorMock', () => {
      expect(errorMock).toBeCalled();
    })

    it('should not call warnMock', () => {
      expect(warnMock).not.toBeCalled();
    });
  });

  describe('no lint violations', () => {
    beforeEach(() => {
      errorMock = jest.fn();
      warnMock = jest.fn();

      const spotConfig = {
        rules:  {
          error: 'invalid',
        }
      }

      deferExit = handleLintViolations(
        [],
        spotConfig,
        { error: errorMock, warn: warnMock }
      )
    });

    it('should return deferExit false', () => {
      expect(deferExit).toBe(false);
    })

    it('should not call errorMock', () => {
      expect(errorMock).not.toBeCalled();
    })

    it('should not call warnMock', () => {
      expect(warnMock).not.toBeCalled();
    });
  });
});