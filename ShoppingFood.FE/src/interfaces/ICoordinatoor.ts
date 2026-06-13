export interface IDispatchOrderItem{
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface IDispatchOrder{
    id: string;
    status: string;
    totalAmount: number;
    shippingFee: number;
    deliveryAddress: string;
    contactName: string;
    contactPhone: string;
    note?: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    restaurantName: string;
    restaurantAddress: string;
    shipperId?: string;
    shipperName: string;
    shipperPhone: string;
    items: IDispatchOrderItem[];
}