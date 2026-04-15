import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useAccountName } from './useAccountName';
import useEnsNameByAddress from '../../components/hooks/useEnsNameByAddress';
import { isDefaultAccountName } from '../../util/ENSUtils';

jest.mock('react-redux', () => ({
  useSelector: jest.fn()
}));
jest.mock('../../components/hooks/useEnsNameByAddress', () => jest.fn());
jest.mock('../../util/ENSUtils', () => ({
  isDefaultAccountName: jest.fn()
}));

describe('useAccountName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the ENS name when default name is a default account name', () => {
    useSelector.mockReturnValue({
      metadata: { name: 'Account 1' },
      address: '0x1234567890123456789012345678901234567890'
    });
    useEnsNameByAddress.mockReturnValue({ ensName: 'test.eth' });
    isDefaultAccountName.mockReturnValue(true);

    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe('test.eth');
  });

  it('should return the default name when it is not a default account name', () => {
    useSelector.mockReturnValue({
      metadata: { name: 'My Custom Account' },
      address: '0x1234567890123456789012345678901234567890'
    });
    useEnsNameByAddress.mockReturnValue({ ensName: 'test.eth' });
    isDefaultAccountName.mockReturnValue(false);

    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe('My Custom Account');
  });

  it('should return an empty string when both default name and ENS name are undefined', () => {
    useSelector.mockReturnValue({
      metadata: { name: undefined },
      address: '0x1234567890123456789012345678901234567890'
    });
    useEnsNameByAddress.mockReturnValue({ ensName: undefined });
    isDefaultAccountName.mockReturnValue(false);

    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe('');
  });

  it('should return an empty string when default name is undefined and ENS name is available', () => {
    useSelector.mockReturnValue({
      metadata: { name: undefined },
      address: '0x1234567890123456789012345678901234567890'
    });
    useEnsNameByAddress.mockReturnValue({ ensName: 'test.eth' });
    isDefaultAccountName.mockReturnValue(false);

    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe('');
  });

  it('should return the ENS name when default name is a default account name and ENS name is available', () => {
    useSelector.mockReturnValue({
      metadata: { name: 'Account 1' },
      address: '0x1234567890123456789012345678901234567890'
    });
    useEnsNameByAddress.mockReturnValue({ ensName: 'test.eth' });
    isDefaultAccountName.mockReturnValue(true);

    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe('test.eth');
  });
});