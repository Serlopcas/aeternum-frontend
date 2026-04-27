export const environment = {
  apiBaseUrl: 'https://api.aeternumtrack.com/api',
  tokenKey: 'aeternum.accessToken',
  purchaseCartKey: (userId: number, supplierId: number) =>
    `aeternum.purchase_cart_${userId}_${supplierId}`,
  purchaseCartIndexKey: (userId: number) => `aeternum.purchase_cart_index_${userId}`,
  salesCartKey: (userId: number) => `aeternum.sales_cart_${userId}`,
};
