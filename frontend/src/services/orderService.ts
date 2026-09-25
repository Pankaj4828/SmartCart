export interface CreateOrderItem {
    product_id: number
    quantity: number
}

export interface CreateOrderRequest {
    payment_method: string
    customer_name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
    items: CreateOrderItem[]
}

export interface OrderItem {
    id: number
    product_id: number
    product_name: string
    price: number
    quantity: number
}

export interface Order {
    id: number
    status: string
    payment_method: string
    customer_name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
    total_amount: number
    created_at: string
    items: OrderItem[]
}

const API_BASE_URL = 'http://127.0.0.1:8000'

const TOKEN_KEY = 'smartcart-access-token'

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(
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

export async function createOrder(
    order: CreateOrderRequest,
): Promise<Order> {
    const response = await fetch(
        `${API_BASE_URL}/orders`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(order),
        },
    )

    if (!response.ok) {
        let message = 'Failed to create order'

        try {
            const errorData = await response.json()

            if (errorData.detail) {
                message = errorData.detail
            }
        } catch {
            // Keep the default error message.
        }

        throw new Error(message)
    }

    return response.json()
}

export async function getOrders(): Promise<Order[]> {
    const response = await fetch(
        `${API_BASE_URL}/orders`,
        {
            headers: getAuthHeaders(),
        },
    )

    if (!response.ok) {
        throw new Error(
            'Failed to fetch orders',
        )
    }

    return response.json()
}

export async function getOrder(
    orderId: number,
): Promise<Order> {
    const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}`,
        {
            headers: getAuthHeaders(),
        },
    )

    if (!response.ok) {
        let message = 'Failed to fetch order'

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

export async function cancelOrder(
    orderId: number,
): Promise<Order> {
    const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/cancel`,
        {
            method: 'PATCH',
            headers: getAuthHeaders(),
        },
    )

    if (!response.ok) {
        let message = 'Failed to cancel order'

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