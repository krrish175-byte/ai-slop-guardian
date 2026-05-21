import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("does not update before the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "hello", delay: 300 } },
    );

    rerender({ value: "world", delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });

    expect(result.current).toBe("hello");
  });

  it("updates after the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "hello", delay: 300 } },
    );

    rerender({ value: "world", delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe("world");
  });

  it("resets timer on rapid updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 300 } },
    );

    rerender({ value: "ab", delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: "abc", delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: "abcd", delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });

    expect(result.current).toBe("a");

    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe("abcd");
  });
});
