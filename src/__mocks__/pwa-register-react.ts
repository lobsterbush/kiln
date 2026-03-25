import { vi } from 'vitest'

export const useRegisterSW = vi.fn().mockReturnValue({
  needRefresh: [false],
  updateServiceWorker: vi.fn(),
})
