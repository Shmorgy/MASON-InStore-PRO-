export function getProductImage(product) {
  if (product.imageUrls?.length) return product.imageUrls[0];
  if (product.imageUrl) return product.imageUrl;
  return "/placeholder.png";
}