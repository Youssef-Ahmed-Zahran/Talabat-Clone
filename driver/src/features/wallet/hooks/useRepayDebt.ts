import { useRepayDebtMutation } from "../api/wallet.api";

export function useRepayDebt() {
  const mutation = useRepayDebtMutation();

  return {
    query: {
      isSuccess: mutation.isSuccess,
      errorMessage:
        (mutation.error as any)?.response?.data?.message ??
        (mutation.error as any)?.message ??
        null,
    },
    state: {},
    modal: {},
    actions: {
      submit: mutation.mutate,
      reset: mutation.reset,
      isPending: mutation.isPending,
    },
  };
}

