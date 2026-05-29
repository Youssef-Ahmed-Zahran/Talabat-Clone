import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import type { Store } from "../../../types";
import { useUpdateStore } from "../api/store.api";
import { handleApiError } from "../../../utils/error";
import {
  clientEditStoreSchema,
  type ClientEditStoreValues,
  getClientEditDefaults,
} from "../../../schemas/clientEditStore.schema";

export function useClientStoreEditForm(
  store: Store,
  isOpen: boolean,
  onClose: () => void,
) {
  const updateMutation = useUpdateStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientEditStoreValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientEditStoreSchema) as any,
    defaultValues: getClientEditDefaults(store),
  });

  useEffect(() => {
    if (isOpen) reset(getClientEditDefaults(store));
  }, [isOpen, store, reset]);

  const logoUrl = watch("logoUrl");
  const coverImage = watch("coverImage");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "logoUrl" | "coverImage",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setValue(fieldName, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: ClientEditStoreValues) => {
    updateMutation.mutate(
      { storeId: String(store.id), payload: { ...data, logo: data.logoUrl, cover: data.coverImage } },
      {
        onSuccess: () => {
          toast.success("Store details updated successfully");
          onClose();
        },
        onError: (err) => handleApiError(err, "We couldn't update the store details."),
      },
    );
  };

  return {
    form: {
      register,
      handleSubmit,
      errors,
      onSubmit,
    },
    state: {
      logoUrl,
      coverImage,
      handleFileChange,
      isPending: updateMutation.isPending,
    },
  };
}
