const SIZE_ABBREVIATIONS = {
  Small: "S",
  Medium: "M",
  Large: "L",
};

const normalizeText = (value) => String(value || "").trim();

export const formatCustomerPurchaseLabel = (customer) => {
  const fullName = normalizeText(customer?.full_name);
  const itemType = normalizeText(customer?.item_type);
  const cylinderSize = normalizeText(customer?.cylinder_size);
  const shortSize = SIZE_ABBREVIATIONS[cylinderSize] || cylinderSize;
  const purchaseLabel = [itemType, shortSize].filter(Boolean).join("-");

  if (!purchaseLabel) {
    return fullName || "—";
  }

  return fullName ? `${fullName}(${purchaseLabel})` : purchaseLabel;
};
