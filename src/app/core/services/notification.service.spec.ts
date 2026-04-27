import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('starts with no toasts', () => {
    expect(service.toasts()).toHaveLength(0);
  });

  describe('success()', () => {
    it('adds a toast with type "success"', () => {
      service.success('Done', 'Operation succeeded');
      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Done');
      expect(toasts[0].message).toBe('Operation succeeded');
    });

    it('assigns default 4000ms duration', () => {
      service.success('Title');
      expect(service.toasts()[0].duration).toBe(4000);
    });
  });

  describe('error()', () => {
    it('adds a toast with type "error" and 8000ms duration', () => {
      service.error('Fail', 'Something went wrong');
      const toast = service.toasts()[0];
      expect(toast.type).toBe('error');
      expect(toast.duration).toBe(8000);
    });
  });

  describe('warning()', () => {
    it('adds a toast with type "warning" and 6000ms duration', () => {
      service.warning('Watch out');
      const toast = service.toasts()[0];
      expect(toast.type).toBe('warning');
      expect(toast.duration).toBe(6000);
    });
  });

  describe('info()', () => {
    it('adds a toast with type "info"', () => {
      service.info('FYI');
      expect(service.toasts()[0].type).toBe('info');
    });
  });

  describe('dismiss()', () => {
    it('removes the toast with the given id', () => {
      service.success('A');
      service.success('B');
      const idA = service.toasts()[0].id;
      service.dismiss(idA);
      const remaining = service.toasts();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].title).toBe('B');
    });

    it('does nothing when id does not exist', () => {
      service.success('One');
      service.dismiss(999);
      expect(service.toasts()).toHaveLength(1);
    });
  });

  describe('toast accumulation', () => {
    it('stacks multiple toasts in order', () => {
      service.success('First');
      service.error('Second');
      service.info('Third');
      const titles = service.toasts().map((t) => t.title);
      expect(titles).toEqual(['First', 'Second', 'Third']);
    });

    it('assigns unique sequential ids', () => {
      service.success('A');
      service.success('B');
      service.success('C');
      const ids = service.toasts().map((t) => t.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('auto-dismiss', () => {
    it('removes the toast automatically after its duration', () => {
      vi.useFakeTimers();
      service.success('Auto-dismiss me'); // 4000ms
      expect(service.toasts()).toHaveLength(1);
      vi.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(0);
    });

    it('different durations auto-dismiss independently', () => {
      vi.useFakeTimers();
      service.success('Short'); // 4000ms
      service.error('Long'); // 8000ms
      vi.advanceTimersByTime(4001);
      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].title).toBe('Long');
      vi.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(0);
    });
  });
});
