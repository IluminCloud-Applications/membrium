import { useState, type FormEvent } from "react";

interface UseFormOptions<T extends Record<string, string>> {
    initialValues: T;
    onSubmit: (values: T) => Promise<void>;
}

export function useForm<T extends Record<string, string>>({
    initialValues,
    onSubmit,
}: UseFormOptions<T>) {
    const [values, setValues] = useState<T>(initialValues);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: keyof T) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await onSubmit(values);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ocorreu um erro inesperado";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setValues(initialValues);
        setError(null);
    };

    return {
        values,
        isLoading,
        error,
        setError,
        handleChange,
        handleSubmit,
        reset,
    };
}
