import type {
    Order,
} from './orderService'

const API_BASE_URL =
    'http://127.0.0.1:8000'

const TOKEN_KEY =
    'smartcart-access-token'

function getAuthHeaders(): Record<string, string> {
    const token =
        localStorage.getItem(
            TOKEN_KEY,
        )

    if (!token) {
        throw new Error(
            'You must be logged in to manage orders.',
        )
    }

    return {
        Authorization: `Bearer ${token}`,
    }
}

export type AdminOrderStatus =
    | 'CONFIRMED'
    | 'SHIPPED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'

export async function getAdminOrders(): Promise<
    Order[]
> {
    const response = await fetch(
        `${API_BASE_URL}/admin/orders`,
        {
            headers: getAuthHeaders(),
        },
    )

    if (!response.ok) {
        let message =
            'Failed to fetch admin orders'

        try {
            const errorData =
                await response.json()

            if (errorData.detail) {
                message = errorData.detail
            }
        } catch {
            // Keep default message.
        }

        throw new Error(message)
    }

    return response.json()
}

export async function updateAdminOrderStatus(
    orderId: number,
    newStatus: AdminOrderStatus,
): Promise<Order> {
    const params =
        new URLSearchParams()

    params.set(
        'new_status',
        newStatus,
    )

    const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/status?${params.toString()}`,
        {
            method: 'PATCH',
            headers: getAuthHeaders(),
        },
    )

    if (!response.ok) {
        let message =
            'Failed to update order status'

        try {
            const errorData =
                await response.json()

            if (errorData.detail) {
                message = errorData.detail
            }
        } catch {
            // Keep default message.
        }

        throw new Error(message)
    }

    return response.json()
}