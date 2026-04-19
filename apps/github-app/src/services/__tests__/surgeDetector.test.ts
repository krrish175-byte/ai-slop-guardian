import { SurgeDetector } from '../surgeDetector';

describe('SurgeDetector', () => {
  let detector: SurgeDetector;

  beforeEach(() => {
    detector = new SurgeDetector();
  });

  test('should return null when under threshold', () => {
    const result = detector.checkSurge('repo1', 'user1');
    expect(result).toBeNull();
  });

  test('should detect contributor surge when over threshold', () => {
    const repoId = 'repo1';
    const userId = 'user1';

    // Threshold is 5 PRs per hour. So 6th PR should trigger it.
    for (let i = 0; i < 5; i++) {
      expect(detector.checkSurge(repoId, userId)).toBeNull();
    }

    expect(detector.checkSurge(repoId, userId)).toBe('contributor_surge');
  });

  test('should detect repo flood when over threshold', () => {
    const repoId = 'repo1';

    // Threshold is 20 PRs per hour. So 21st PR should trigger it.
    for (let i = 0; i < 20; i++) {
      const userId = `user${i}`;
      expect(detector.checkSurge(repoId, userId)).toBeNull();
    }

    expect(detector.checkSurge(repoId, 'last-user')).toBe('repo_flood');
  });

  test('should reset counts after one hour', () => {
    const repoId = 'repo1';
    const userId = 'user1';

    const mockDate = jest.spyOn(Date, 'now');
    
    const startTime = 1000000;
    mockDate.mockReturnValue(startTime);

    for (let i = 0; i < 5; i++) {
        detector.checkSurge(repoId, userId);
    }

    // Move time forward by 1 hour and 1 second
    mockDate.mockReturnValue(startTime + 60 * 60 * 1000 + 1000);

    expect(detector.checkSurge(repoId, userId)).toBeNull();
    
    mockDate.mockRestore();
  });
});
