export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
    const data = error?.response?.data

    return (
        data?.error?.message ||
        data?.message ||
        error?.message ||
        fallback
    )
}
